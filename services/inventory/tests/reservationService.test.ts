import type { Db } from "@atlas/shared";
import { describe, expect, it } from "vitest";
import { ReservationService } from "../src/domain/reservationService.js";
import type { MovementsRepository } from "../src/repositories/movementsRepository.js";
import type { ReservationsRepository } from "../src/repositories/reservationsRepository.js";
import type { StockLevelsRepository } from "../src/repositories/stockLevelsRepository.js";

class TxDb implements Db {
  txCalls = 0;

  async query<R>(): Promise<R[]> {
    return [];
  }

  async withTx<R>(fn: (tx: Db) => Promise<R>): Promise<R> {
    this.txCalls += 1;
    return fn(this);
  }

  async close(): Promise<void> {}
}

describe("ReservationService", () => {
  it("rolls reservation creation through the Db transaction boundary", async () => {
    const db = new TxDb();
    const reservations = {
      createPending: async () => ({
        id: "reservation-1",
        orderId: "order-1",
        status: "pending",
        expiresAt: new Date(),
        createdAt: new Date()
      }),
      insertLine: async () => ({
        id: "line-1",
        reservationId: "reservation-1",
        productId: "product-1",
        warehouseId: "warehouse-1",
        qty: 2
      }),
      listLines: async () => [
        {
          id: "line-1",
          reservationId: "reservation-1",
          productId: "product-1",
          warehouseId: "warehouse-1",
          qty: 2
        }
      ]
    } as unknown as ReservationsRepository;
    const stockLevels = {
      listAvailableForProduct: async () => [
        { productId: "product-1", warehouseId: "warehouse-1", onHand: 10, reserved: 0, available: 10 }
      ],
      reserveAvailable: async () => ({
        productId: "product-1",
        warehouseId: "warehouse-1",
        onHand: 10,
        reserved: 2
      })
    } as unknown as StockLevelsRepository;
    const movements = {} as MovementsRepository;

    const service = new ReservationService(
      db,
      stockLevels,
      reservations,
      movements,
      600,
      () => new Date("2026-06-12T00:00:00.000Z"),
      (() => {
        let next = 0;
        return () => `id-${++next}`;
      })()
    );

    const result = await service.createReservation({
      orderId: "order-1",
      lines: [{ productId: "product-1", qty: 2 }]
    });

    expect(db.txCalls).toBe(1);
    expect(result.status).toBe("pending");
    expect(result.lines).toEqual([
      { productId: "product-1", warehouseId: "warehouse-1", qty: 2 }
    ]);
  });
});
