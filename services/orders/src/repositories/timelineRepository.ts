import type { Db } from "@atlas/shared";
import type { Order, OrderTimeline, Shipment } from "../domain/models.js";

export interface TimelineRepository {
  assemble(order: Order, shipment: Shipment | null): Promise<OrderTimeline>;
}

export const createTimelineRepository = (_db: Db): TimelineRepository => ({
  async assemble(order, shipment) {
    const events: OrderTimeline["events"] = [
      {
        type: "order" as const,
        status: "pending" as const,
        at: order.placedAt,
        orderId: order.id
      }
    ];

    if (order.status !== "pending") {
      events.push({
        type: "order" as const,
        status: order.status,
        at: order.updatedAt,
        orderId: order.id
      });
    }

    if (shipment) {
      events.push({
        type: "shipment" as const,
        status: shipment.status,
        at: shipment.createdAt,
        orderId: order.id,
        shipmentId: shipment.id,
        carrier: shipment.carrier,
        trackingNo: shipment.trackingNo
      });
    }

    return {
      orderId: order.id,
      events: events.sort((a, b) => a.at.localeCompare(b.at))
    };
  }
});
