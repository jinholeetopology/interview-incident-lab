import type { Logger } from "@atlas/shared";
import type { ReservationService } from "../domain/reservationService.js";
import type { StoppableJob } from "./jobTypes.js";

export interface ReservationExpiryJobDeps {
  intervalMs: number;
  logger: Logger;
  reservationService: ReservationService;
}

export const startReservationExpiryJob = (deps: ReservationExpiryJobDeps): StoppableJob => {
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped) {
      return;
    }

    try {
      const releasedCount = await deps.reservationService.expirePendingReservations();
      if (releasedCount > 0) {
        deps.logger.info("expired reservations released", { releasedCount });
      }
    } catch (err) {
      deps.logger.warn("reservation expiry job failed", {
        err: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, deps.intervalMs);

  void tick();

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    }
  };
};
