import { randomUUID } from "node:crypto";
import type { Cache, Db } from "@atlas/shared";
import type { RequestContext } from "../requestContext.js";
import type { OrderRepository, ShipmentRepository } from "../repositories/index.js";
import { invalidateOrderCache } from "./cacheInvalidation.js";
import { orderConflictError, orderNotFoundError } from "./errors.js";
import type { Order, Shipment } from "./models.js";

export interface ShipOrderInput {
  carrier?: string | undefined;
  trackingNo?: string | undefined;
}

export interface ShipOrderDeps {
  db: Db;
  orders: OrderRepository;
  shipments: ShipmentRepository;
  cache: Cache;
}

export interface ShipOrderResult {
  order: Order;
  shipment: Shipment;
}

const defaultTrackingNo = (): string =>
  `AT${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 8).toUpperCase()}`;

export const shipOrder = async (
  deps: ShipOrderDeps,
  orderId: string,
  input: ShipOrderInput,
  _ctx: RequestContext
): Promise<ShipOrderResult> => {
  const result = await deps.db.withTx(async (tx) => {
    const order = await deps.orders.findByIdForUpdate(orderId, tx);
    if (!order) {
      throw orderNotFoundError(orderId);
    }
    if (order.status !== "confirmed") {
      throw orderConflictError("ORDER_NOT_SHIPPABLE", "Only confirmed orders can be shipped", {
        orderId,
        status: order.status
      });
    }

    const existingShipment = await deps.shipments.findByOrderIdForUpdate(orderId, tx);
    if (existingShipment) {
      throw orderConflictError("SHIPMENT_ALREADY_EXISTS", "Order already has a shipment", {
        orderId,
        shipmentId: existingShipment.id
      });
    }

    const shipment = await deps.shipments.create(
      {
        id: randomUUID(),
        orderId,
        carrier: input.carrier ?? "Atlas Freight",
        trackingNo: input.trackingNo ?? defaultTrackingNo()
      },
      tx
    );
    const shipped = await deps.orders.markShipped(orderId, tx);

    return { order: shipped, shipment };
  });

  await invalidateOrderCache(deps.cache, orderId);
  return result;
};
