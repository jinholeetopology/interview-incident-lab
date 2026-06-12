import { describe, expect, it } from "vitest";
import { createTimelineRepository } from "../src/repositories/timelineRepository.js";
import { orderFixture } from "./fixtures.js";

describe("timeline repository", () => {
  it("assembles order and shipment events from local rows", async () => {
    const timelines = createTimelineRepository({} as never);
    const timeline = await timelines.assemble(orderFixture("shipped"), {
      id: "shipment-1",
      orderId: "order-1",
      status: "dispatched",
      carrier: "Atlas Freight",
      trackingNo: "AT1",
      createdAt: "2026-06-12T00:00:02.000Z"
    });

    expect(timeline.events).toEqual([
      expect.objectContaining({ type: "order", status: "pending" }),
      expect.objectContaining({ type: "order", status: "shipped" }),
      expect.objectContaining({ type: "shipment", status: "dispatched" })
    ]);
  });
});
