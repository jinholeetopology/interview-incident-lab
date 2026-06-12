import { describe, expect, it, vi } from "vitest";
import { runShipmentProgressTick } from "../src/jobs/shipmentProgressTick.js";
import { cacheFixture, loggerFixture } from "./fixtures.js";

describe("runShipmentProgressTick", () => {
  it("advances eligible shipment statuses and invalidates order caches", async () => {
    const cache = cacheFixture();
    const shipments = {
      listReadyToAdvance: vi.fn(async () => [
        {
          id: "shipment-1",
          orderId: "order-1",
          status: "preparing" as const,
          carrier: "Atlas Freight",
          trackingNo: "AT1",
          createdAt: "2026-06-12T00:00:00.000Z"
        }
      ]),
      advanceStatus: vi.fn(async () => ({
        id: "shipment-1",
        orderId: "order-1",
        status: "dispatched" as const,
        carrier: "Atlas Freight",
        trackingNo: "AT1",
        createdAt: "2026-06-12T00:00:00.000Z"
      }))
    };

    const advanced = await runShipmentProgressTick({
      shipments: shipments as never,
      cache,
      logger: loggerFixture()
    });

    expect(advanced).toBe(1);
    expect(shipments.advanceStatus).toHaveBeenCalledWith(
      "shipment-1",
      "preparing",
      "dispatched"
    );
    expect(cache.del).toHaveBeenCalledWith("order:order-1", "order:order-1:timeline");
  });
});
