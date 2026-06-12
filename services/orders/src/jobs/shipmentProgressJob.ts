import type { Logger } from "@atlas/shared";
import {
  runShipmentProgressTick,
  type ShipmentProgressTickDeps
} from "./shipmentProgressTick.js";

export interface ShipmentProgressJob {
  stop(): void;
}

export const startShipmentProgressJob = (
  deps: ShipmentProgressTickDeps & { logger: Logger },
  intervalMs: number
): ShipmentProgressJob => {
  const timer = setInterval(() => {
    runShipmentProgressTick(deps).catch((err) => {
      deps.logger.error("shipment progress job failed", {
        error: err instanceof Error ? err.message : String(err)
      });
    });
  }, intervalMs);

  timer.unref?.();

  return {
    stop() {
      clearInterval(timer);
    }
  };
};
