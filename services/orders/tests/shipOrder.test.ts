import { describe, expect, it, vi } from "vitest";
import type { Db } from "@atlas/shared";
import { shipOrder } from "../src/domain/shipOrder.js";
import { cacheFixture, orderFixture } from "./fixtures.js";

describe("shipOrder", () => {
  it("creates one preparing shipment and marks the order shipped atomically", async () => {
    const tx = {} as Db;
    const db = {
      withTx: vi.fn(async <T>(fn: (tx: Db) => Promise<T>) => fn(tx))
    } as unknown as Db;
    const orders = {
      findByIdForUpdate: vi.fn(async () => orderFixture("confirmed")),
      markShipped: vi.fn(async () => orderFixture("shipped"))
    };
    const shipments = {
      findByOrderIdForUpdate: vi.fn(async () => null),
      create: vi.fn(async () => ({
        id: "shipment-1",
        orderId: "order-1",
        status: "preparing" as const,
        carrier: "Atlas Freight",
        trackingNo: "AT1",
        createdAt: "2026-06-12T00:00:00.000Z"
      }))
    };
    const cache = cacheFixture();

    const result = await shipOrder(
      {
        db,
        orders: orders as never,
        shipments: shipments as never,
        cache
      },
      "order-1",
      { carrier: "Atlas Freight", trackingNo: "AT1" },
      { requestId: "req-1" }
    );

    expect(result.order.status).toBe("shipped");
    expect(result.shipment.status).toBe("preparing");
    expect(orders.findByIdForUpdate).toHaveBeenCalledWith("order-1", tx);
    expect(shipments.findByOrderIdForUpdate).toHaveBeenCalledWith("order-1", tx);
    expect(shipments.create).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1", carrier: "Atlas Freight" }),
      tx
    );
    expect(cache.del).toHaveBeenCalledWith("order:order-1", "order:order-1:timeline");
  });
});
