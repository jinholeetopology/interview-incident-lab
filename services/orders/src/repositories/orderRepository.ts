import type { Db } from "@atlas/shared";
import type { ListResult, Page } from "../domain/pagination.js";
import type { Order, OrderItem, OrderStatus } from "../domain/models.js";
import { orderConflictError, orderNotFoundError } from "../domain/errors.js";
import { mapOrder, mapOrderItem } from "./mapRows.js";
import type { CountRow, OrderItemRow, OrderRow } from "./rowTypes.js";

export interface CreateOrderItemInput {
  id: string;
  productId: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface CreateOrderInput {
  id: string;
  customerId: string;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  items: CreateOrderItemInput[];
}

export interface OrderListFilter {
  customerId?: string;
  status?: OrderStatus;
}

export interface OrderRepository {
  createPending(input: CreateOrderInput): Promise<Order>;
  findById(orderId: string, dbOverride?: Db): Promise<Order | null>;
  findByIdOrThrow(orderId: string, dbOverride?: Db): Promise<Order>;
  findByIdForUpdate(orderId: string, dbOverride?: Db): Promise<Order | null>;
  list(filter: OrderListFilter, page: Page): Promise<ListResult<Order>>;
  markReserved(orderId: string, reservationId: string, dbOverride?: Db): Promise<Order>;
  attachPaymentIntent(
    orderId: string,
    paymentIntentId: string,
    dbOverride?: Db
  ): Promise<Order>;
  markConfirmed(orderId: string, dbOverride?: Db): Promise<Order>;
  markFailed(orderId: string, dbOverride?: Db): Promise<Order>;
  markCancelled(orderId: string, dbOverride?: Db): Promise<Order>;
  markShipped(orderId: string, dbOverride?: Db): Promise<Order>;
}

const orderSelect = `
  select id, customer_id, status, currency, subtotal_cents, total_cents,
         reservation_id, payment_intent_id, placed_at, updated_at
  from orders
`;

const loadItems = async (db: Db, orderId: string): Promise<OrderItem[]> => {
  const itemRows = await db.query<OrderItemRow>(
    `
    select id, order_id, product_id, qty, unit_price_cents, line_total_cents
    from order_items
    where order_id = $1
    order by id
    `,
    [orderId]
  );
  return itemRows.map(mapOrderItem);
};

const loadOrderFromRow = async (db: Db, row: OrderRow): Promise<Order> =>
  mapOrder(row, await loadItems(db, row.id));

const findByIdInternal = async (
  defaultDb: Db,
  orderId: string,
  dbOverride: Db = defaultDb
): Promise<Order | null> => {
  const rows = await dbOverride.query<OrderRow>(`${orderSelect} where id = $1`, [
    orderId
  ]);

  const row = rows[0];
  return row ? loadOrderFromRow(dbOverride, row) : null;
};

const findByIdOrThrowInternal = async (
  defaultDb: Db,
  orderId: string,
  dbOverride: Db = defaultDb
): Promise<Order> => {
  const order = await findByIdInternal(defaultDb, orderId, dbOverride);
  if (!order) {
    throw orderNotFoundError(orderId);
  }
  return order;
};

const updateStatus = async (
  db: Db,
  orderId: string,
  nextStatus: OrderStatus,
  allowedStatuses: OrderStatus[],
  extraSet: string,
  extraParams: unknown[]
): Promise<Order> => {
  const statusParams = allowedStatuses.map((_, index) => `$${extraParams.length + index + 3}`);
  const rows = await db.query<OrderRow>(
    `
    update orders
    set status = $2,
        updated_at = now()
        ${extraSet}
    where id = $1
      and status in (${statusParams.join(", ")})
    returning id, customer_id, status, currency, subtotal_cents, total_cents,
              reservation_id, payment_intent_id, placed_at, updated_at
    `,
    [orderId, nextStatus, ...extraParams, ...allowedStatuses]
  );

  const row = rows[0];
  if (!row) {
    throw orderConflictError("ORDER_STATUS_CONFLICT", "Order status transition is not allowed", {
      orderId,
      nextStatus,
      allowedStatuses
    });
  }

  return loadOrderFromRow(db, row);
};

export const createOrderRepository = (db: Db): OrderRepository => ({
  async createPending(input) {
    await db.withTx(async (tx) => {
      await tx.query(
        `
        insert into orders (
          id, customer_id, status, currency, subtotal_cents, total_cents,
          reservation_id, payment_intent_id, placed_at, updated_at
        )
        values ($1, $2, 'pending', $3, $4, $5, null, null, now(), now())
        `,
        [
          input.id,
          input.customerId,
          input.currency,
          input.subtotalCents,
          input.totalCents
        ]
      );

      for (const item of input.items) {
        await tx.query(
          `
          insert into order_items (
            id, order_id, product_id, qty, unit_price_cents, line_total_cents
          )
          values ($1, $2, $3, $4, $5, $6)
          `,
          [
            item.id,
            input.id,
            item.productId,
            item.qty,
            item.unitPriceCents,
            item.lineTotalCents
          ]
        );
      }
    });

    return findByIdOrThrowInternal(db, input.id);
  },

  async findById(orderId, dbOverride = db) {
    return findByIdInternal(db, orderId, dbOverride);
  },

  async findByIdOrThrow(orderId, dbOverride = db) {
    return findByIdOrThrowInternal(db, orderId, dbOverride);
  },

  async findByIdForUpdate(orderId, dbOverride = db) {
    const rows = await dbOverride.query<OrderRow>(
      `${orderSelect} where id = $1 for update`,
      [orderId]
    );

    const row = rows[0];
    return row ? loadOrderFromRow(dbOverride, row) : null;
  },

  async list(filter, page) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.customerId) {
      params.push(filter.customerId);
      conditions.push(`customer_id = $${params.length}`);
    }
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
    const countRows = await db.query<CountRow>(
      `select count(*)::int as total from orders ${whereSql}`,
      params
    );

    const listParams = [...params, page.limit, page.offset];
    const orderRows = await db.query<OrderRow>(
      `
      ${orderSelect}
      ${whereSql}
      order by placed_at desc, id desc
      limit $${params.length + 1}
      offset $${params.length + 2}
      `,
      listParams
    );

    const items = await Promise.all(orderRows.map((row) => loadOrderFromRow(db, row)));
    const countRow = countRows[0];
    return { items, total: countRow ? Number(countRow.total) : 0 };
  },

  async markReserved(orderId, reservationId, dbOverride = db) {
    return updateStatus(
      dbOverride,
      orderId,
      "reserved",
      ["pending"],
      ", reservation_id = $3",
      [reservationId]
    );
  },

  async attachPaymentIntent(orderId, paymentIntentId, dbOverride = db) {
    const rows = await dbOverride.query<OrderRow>(
      `
      update orders
      set payment_intent_id = $2,
          updated_at = now()
      where id = $1
        and status = 'reserved'
      returning id, customer_id, status, currency, subtotal_cents, total_cents,
                reservation_id, payment_intent_id, placed_at, updated_at
      `,
      [orderId, paymentIntentId]
    );

    const row = rows[0];
    if (!row) {
      throw orderConflictError("ORDER_STATUS_CONFLICT", "Order is not reserved", {
        orderId,
        paymentIntentId
      });
    }

    return loadOrderFromRow(dbOverride, row);
  },

  async markConfirmed(orderId, dbOverride = db) {
    return updateStatus(dbOverride, orderId, "confirmed", ["reserved"], "", []);
  },

  async markFailed(orderId, dbOverride = db) {
    return updateStatus(dbOverride, orderId, "failed", ["pending", "reserved"], "", []);
  },

  async markCancelled(orderId, dbOverride = db) {
    return updateStatus(dbOverride, orderId, "cancelled", ["confirmed"], "", []);
  },

  async markShipped(orderId, dbOverride = db) {
    return updateStatus(dbOverride, orderId, "shipped", ["confirmed"], "", []);
  }
});
