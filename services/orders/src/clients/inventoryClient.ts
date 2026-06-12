import type { Logger, ServiceClient } from "@atlas/shared";
import { withRetry } from "@atlas/shared";
import { insufficientStockError } from "../domain/errors.js";
import type { RequestContext } from "../requestContext.js";
import type { ReadyClient, ReservationResponse } from "./types.js";
import { isUpstreamError, logAndMapUpstream } from "./upstream.js";

export interface InventoryClient extends ReadyClient {
  createReservation(
    input: { orderId: string; lines: Array<{ productId: string; qty: number }> },
    ctx: RequestContext
  ): Promise<ReservationResponse>;
  commitReservation(reservationId: string, ctx: RequestContext): Promise<void>;
  releaseReservation(reservationId: string, ctx: RequestContext): Promise<void>;
}

export const createInventoryClient = (
  client: ServiceClient,
  logger: Logger
): InventoryClient => ({
  async createReservation(input, ctx) {
    try {
      return await client.post<ReservationResponse>("/reservations", input);
    } catch (err) {
      if (isUpstreamError(err)) {
        logger.warn("inventory reservation failed", {
          ...ctx,
          orderId: input.orderId,
          status: err.status,
          body: err.body
        });
        if (err.status === 409) {
          throw insufficientStockError(input.orderId, { lines: input.lines });
        }
        throw logAndMapUpstream(
          err,
          logger,
          "inventory",
          "reservation",
          { ...ctx, orderId: input.orderId },
          "INVENTORY_RESERVATION_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async commitReservation(reservationId, ctx) {
    try {
      await client.post(`/reservations/${encodeURIComponent(reservationId)}/commit`);
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "inventory",
          "reservation commit",
          { ...ctx, reservationId },
          "INVENTORY_COMMIT_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async releaseReservation(reservationId, ctx) {
    try {
      await client.post(`/reservations/${encodeURIComponent(reservationId)}/release`);
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "inventory",
          "reservation release",
          { ...ctx, reservationId },
          "INVENTORY_RELEASE_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async checkReady(ctx) {
    try {
      await withRetry(() => client.get("/ready"), { retries: 2, baseDelayMs: 25 });
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "inventory",
          "ready check",
          ctx,
          "INVENTORY_READY_FAILED"
        );
      }
      throw err;
    }
  }
});
