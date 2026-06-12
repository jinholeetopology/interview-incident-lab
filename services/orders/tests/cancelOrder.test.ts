import { describe, expect, it, vi } from "vitest";
import type { Cache, Db, Logger } from "@atlas/shared";
import { cancelOrder } from "../src/domain/cancelOrder.js";
import { cacheFixture, loggerFixture, orderFixture } from "./fixtures.js";

describe("cancelOrder", () => {
  it("locks a confirmed unshipped order, compensates, and marks it cancelled", async () => {
    const tx = {} as Db;
    const db = {
      withTx: vi.fn(async <T>(fn: (tx: Db) => Promise<T>) => fn(tx))
    } as unknown as Db;
    const orders = {
      findByIdForUpdate: vi.fn(async () => orderFixture("confirmed")),
      markCancelled: vi.fn(async () => orderFixture("cancelled"))
    };
    const shipments = {
      findByOrderIdForUpdate: vi.fn(async () => null)
    };
    const inventory = {
      releaseReservation: vi.fn(async () => undefined)
    };
    const payments = {
      voidIntent: vi.fn(async () => undefined)
    };
    const cache = cacheFixture();

    const result = await cancelOrder(
      {
        db,
        orders: orders as never,
        shipments: shipments as never,
        inventory: inventory as never,
        payments: payments as never,
        cache,
        logger: loggerFixture() as Logger
      },
      "order-1",
      { requestId: "req-1" }
    );

    expect(result.status).toBe("cancelled");
    expect(orders.findByIdForUpdate).toHaveBeenCalledWith("order-1", tx);
    expect(shipments.findByOrderIdForUpdate).toHaveBeenCalledWith("order-1", tx);
    expect(inventory.releaseReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.objectContaining({ orderId: "order-1" })
    );
    expect(payments.voidIntent).toHaveBeenCalledWith(
      "payment-intent-1",
      expect.objectContaining({ orderId: "order-1" })
    );
    expect(cache.del).toHaveBeenCalledWith("order:order-1", "order:order-1:timeline");
  });

  it("rejects cancellation after a shipment exists", async () => {
    const db = {
      withTx: vi.fn(async <T>(fn: (tx: Db) => Promise<T>) => fn({} as Db))
    } as unknown as Db;

    await expect(
      cancelOrder(
        {
          db,
          orders: {
            findByIdForUpdate: vi.fn(async () => orderFixture("confirmed"))
          } as never,
          shipments: {
            findByOrderIdForUpdate: vi.fn(async () => ({
              id: "shipment-1",
              orderId: "order-1",
              status: "preparing",
              carrier: "Atlas Freight",
              trackingNo: "AT1",
              createdAt: "2026-06-12T00:00:00.000Z"
            }))
          } as never,
          inventory: { releaseReservation: vi.fn() } as never,
          payments: { voidIntent: vi.fn() } as never,
          cache: cacheFixture() as Cache,
          logger: loggerFixture() as Logger
        },
        "order-1",
        { requestId: "req-1" }
      )
    ).rejects.toMatchObject({ code: "ORDER_ALREADY_SHIPPED" });
  });
});
