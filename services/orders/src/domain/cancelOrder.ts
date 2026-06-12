import type { Cache, Db, Logger } from "@atlas/shared";
import type { InventoryClient } from "../clients/inventoryClient.js";
import type { PaymentsClient } from "../clients/paymentsClient.js";
import type { RequestContext } from "../requestContext.js";
import type { OrderRepository, ShipmentRepository } from "../repositories/index.js";
import { invalidateOrderCache } from "./cacheInvalidation.js";
import { orderConflictError, orderNotFoundError } from "./errors.js";
import type { Order } from "./models.js";

export interface CancelOrderDeps {
  db: Db;
  orders: OrderRepository;
  shipments: ShipmentRepository;
  inventory: InventoryClient;
  payments: PaymentsClient;
  cache: Cache;
  logger: Logger;
}

export const cancelOrder = async (
  deps: CancelOrderDeps,
  orderId: string,
  ctx: RequestContext
): Promise<Order> => {
  const cancelled = await deps.db.withTx(async (tx) => {
    const order = await deps.orders.findByIdForUpdate(orderId, tx);
    if (!order) {
      throw orderNotFoundError(orderId);
    }
    if (order.status !== "confirmed") {
      throw orderConflictError("ORDER_NOT_CANCELLABLE", "Only confirmed orders can be cancelled", {
        orderId,
        status: order.status
      });
    }

    const shipment = await deps.shipments.findByOrderIdForUpdate(orderId, tx);
    if (shipment) {
      throw orderConflictError("ORDER_ALREADY_SHIPPED", "Shipped orders cannot be cancelled", {
        orderId,
        shipmentId: shipment.id,
        shipmentStatus: shipment.status
      });
    }

    if (order.reservationId) {
      deps.logger.warn("releasing reservation during order cancellation", {
        ...ctx,
        orderId,
        reservationId: order.reservationId
      });
      await deps.inventory.releaseReservation(order.reservationId, { ...ctx, orderId });
    }

    if (order.paymentIntentId) {
      deps.logger.warn("voiding payment intent during order cancellation", {
        ...ctx,
        orderId,
        paymentIntentId: order.paymentIntentId
      });
      await deps.payments.voidIntent(order.paymentIntentId, { ...ctx, orderId });
    }

    return deps.orders.markCancelled(orderId, tx);
  });

  await invalidateOrderCache(deps.cache, orderId);
  return cancelled;
};
