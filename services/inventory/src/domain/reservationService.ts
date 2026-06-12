import type { Db } from "@atlas/shared";
import { planAllocations } from "./allocation.js";
import {
  emptyReservation,
  insufficientStock,
  reservationAlreadyCommitted,
  reservationAlreadyReleased,
  reservationNotFound
} from "./errors.js";
import { reservationResult } from "./reservationMapper.js";
import type { CreateReservationInput } from "./reservationTypes.js";
import type { ReservationResult } from "./resultTypes.js";
import { normalizeReservationLines } from "./stockMath.js";
import { MOVEMENT_REASON, MOVEMENT_REF_TYPE } from "./stockMovement.js";
import { addSeconds, systemClock, type Clock } from "../utils/clock.js";
import { uuid, type IdGenerator } from "../utils/ids.js";
import type { MovementsRepository } from "../repositories/movementsRepository.js";
import type { ReservationsRepository } from "../repositories/reservationsRepository.js";
import type { StockLevelsRepository } from "../repositories/stockLevelsRepository.js";
import { MAX_EXPIRED_RESERVATIONS_PER_TICK } from "../constants.js";

export class ReservationService {
  constructor(
    private readonly db: Db,
    private readonly stockLevels: StockLevelsRepository,
    private readonly reservations: ReservationsRepository,
    private readonly movements: MovementsRepository,
    private readonly reservationTtlSec: number,
    private readonly clock: Clock = systemClock,
    private readonly idGenerator: IdGenerator = uuid
  ) {}

  async createReservation(input: CreateReservationInput): Promise<ReservationResult> {
    const lines = normalizeReservationLines(input.lines);
    if (lines.length === 0) {
      throw emptyReservation();
    }

    return this.db.withTx(async (tx) => {
      const reservation = await this.reservations.createPending(
        tx,
        this.idGenerator(),
        input.orderId,
        addSeconds(this.clock(), this.reservationTtlSec)
      );

      for (const line of lines) {
        const candidates = await this.stockLevels.listAvailableForProduct(tx, line.productId);
        const allocations = planAllocations(line.productId, line.qty, candidates);

        for (const allocation of allocations) {
          const updated = await this.stockLevels.reserveAvailable(
            tx,
            allocation.warehouseId,
            allocation.productId,
            allocation.qty
          );

          if (!updated) {
            throw insufficientStock({
              productId: allocation.productId,
              warehouseId: allocation.warehouseId,
              requestedQty: allocation.qty
            });
          }

          await this.reservations.insertLine(
            tx,
            this.idGenerator(),
            reservation.id,
            allocation.productId,
            allocation.warehouseId,
            allocation.qty
          );
        }
      }

      const createdLines = await this.reservations.listLines(tx, reservation.id);
      return reservationResult(reservation, createdLines);
    });
  }

  async commitReservation(reservationId: string): Promise<ReservationResult> {
    return this.db.withTx(async (tx) => {
      const reservation = await this.reservations.findByIdForUpdate(tx, reservationId);
      if (!reservation) {
        throw reservationNotFound(reservationId);
      }

      const lines = await this.reservations.listLines(tx, reservationId);
      if (reservation.status === "committed") {
        return reservationResult(reservation, lines);
      }
      if (reservation.status === "released") {
        throw reservationAlreadyReleased(reservationId);
      }

      for (const line of lines) {
        const updated = await this.stockLevels.commitReserved(
          tx,
          line.warehouseId,
          line.productId,
          line.qty
        );
        if (!updated) {
          throw insufficientStock({
            reservationId,
            productId: line.productId,
            warehouseId: line.warehouseId,
            requestedQty: line.qty
          });
        }

        await this.movements.insert(tx, {
          id: this.idGenerator(),
          warehouseId: line.warehouseId,
          productId: line.productId,
          delta: -line.qty,
          reason: MOVEMENT_REASON.reservationCommit,
          refType: MOVEMENT_REF_TYPE.reservation,
          refId: reservationId
        });
      }

      const committed = await this.reservations.setStatus(tx, reservationId, "committed");
      return reservationResult(committed, lines);
    });
  }

  async releaseReservation(reservationId: string): Promise<ReservationResult> {
    return this.db.withTx(async (tx) => {
      const reservation = await this.reservations.findByIdForUpdate(tx, reservationId);
      if (!reservation) {
        throw reservationNotFound(reservationId);
      }

      const lines = await this.reservations.listLines(tx, reservationId);
      if (reservation.status === "released") {
        return reservationResult(reservation, lines);
      }
      if (reservation.status === "committed") {
        throw reservationAlreadyCommitted(reservationId);
      }

      for (const line of lines) {
        const updated = await this.stockLevels.releaseReserved(
          tx,
          line.warehouseId,
          line.productId,
          line.qty
        );
        if (!updated) {
          throw insufficientStock({
            reservationId,
            productId: line.productId,
            warehouseId: line.warehouseId,
            requestedQty: line.qty
          });
        }
      }

      const released = await this.reservations.setStatus(tx, reservationId, "released");
      return reservationResult(released, lines);
    });
  }

  async expirePendingReservations(limit = MAX_EXPIRED_RESERVATIONS_PER_TICK): Promise<number> {
    const expired = await this.reservations.listExpiredPending(this.db, limit);
    let releasedCount = 0;

    for (const reservation of expired) {
      await this.releaseReservation(reservation.id);
      releasedCount += 1;
    }

    return releasedCount;
  }
}
