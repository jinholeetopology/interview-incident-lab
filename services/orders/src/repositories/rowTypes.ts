import type { OrderStatus, ShipmentStatus } from "../domain/models.js";

export interface CustomerRow {
  id: string;
  code: string;
  name: string;
  tier: "standard" | "gold" | "platinum";
  country: string;
  currency: string;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  status: OrderStatus;
  currency: string;
  subtotal_cents: string | number;
  total_cents: string | number;
  reservation_id: string | null;
  payment_intent_id: string | null;
  placed_at: Date | string;
  updated_at: Date | string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: string | number;
  line_total_cents: string | number;
}

export interface ShipmentRow {
  id: string;
  order_id: string;
  status: ShipmentStatus;
  carrier: string;
  tracking_no: string;
  created_at: Date | string;
}

export interface CountRow {
  total: string | number;
}
