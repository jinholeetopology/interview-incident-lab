export const orderStatuses = [
  "pending",
  "reserved",
  "confirmed",
  "shipped",
  "cancelled",
  "failed"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const shipmentStatuses = ["preparing", "dispatched", "delivered"] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export interface Customer {
  id: string;
  code: string;
  name: string;
  tier: "standard" | "gold" | "platinum";
  country: string;
  currency: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  reservationId: string | null;
  paymentIntentId: string | null;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier: string;
  trackingNo: string;
  createdAt: string;
}

export interface OrderTimelineEvent {
  type: "order" | "shipment";
  status: OrderStatus | ShipmentStatus;
  at: string;
  orderId: string;
  shipmentId?: string;
  carrier?: string;
  trackingNo?: string;
}

export interface OrderTimeline {
  orderId: string;
  events: OrderTimelineEvent[];
}
