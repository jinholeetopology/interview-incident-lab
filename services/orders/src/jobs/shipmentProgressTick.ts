import type { Cache, Logger } from "@atlas/shared";
import type { ShipmentRepository } from "../repositories/index.js";
import { invalidateOrderCache } from "../domain/cacheInvalidation.js";
import type { Shipment, ShipmentStatus } from "../domain/models.js";

export interface ShipmentProgressTickDeps {
  shipments: ShipmentRepository;
  cache: Cache;
  logger: Logger;
}

const nextStatus = (shipment: Shipment): ShipmentStatus | null => {
  if (shipment.status === "preparing") {
    return "dispatched";
  }
  if (shipment.status === "dispatched") {
    return "delivered";
  }
  return null;
};

export const runShipmentProgressTick = async (
  deps: ShipmentProgressTickDeps
): Promise<number> => {
  const candidates = await deps.shipments.listReadyToAdvance();
  let advanced = 0;

  for (const shipment of candidates) {
    const to = nextStatus(shipment);
    if (!to) {
      continue;
    }

    const updated = await deps.shipments.advanceStatus(shipment.id, shipment.status, to);
    if (updated) {
      advanced += 1;
      await invalidateOrderCache(deps.cache, updated.orderId);
      deps.logger.info("shipment status advanced", {
        orderId: updated.orderId,
        shipmentId: updated.id,
        from: shipment.status,
        to: updated.status
      });
    }
  }

  return advanced;
};
