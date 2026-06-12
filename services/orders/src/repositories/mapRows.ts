import type { Customer, Order, OrderItem, Shipment } from "../domain/models.js";
import type {
  CustomerRow,
  OrderItemRow,
  OrderRow,
  ShipmentRow
} from "./rowTypes.js";

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toCents = (value: string | number): number =>
  typeof value === "number" ? value : Number.parseInt(value, 10);

export const mapCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  code: row.code,
  name: row.name,
  tier: row.tier,
  country: row.country,
  currency: row.currency
});

export const mapOrderItem = (row: OrderItemRow): OrderItem => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  qty: row.qty,
  unitPriceCents: toCents(row.unit_price_cents),
  lineTotalCents: toCents(row.line_total_cents)
});

export const mapOrder = (row: OrderRow, items: OrderItem[]): Order => ({
  id: row.id,
  customerId: row.customer_id,
  status: row.status,
  currency: row.currency,
  subtotalCents: toCents(row.subtotal_cents),
  totalCents: toCents(row.total_cents),
  reservationId: row.reservation_id,
  paymentIntentId: row.payment_intent_id,
  placedAt: toIso(row.placed_at),
  updatedAt: toIso(row.updated_at),
  items
});

export const mapShipment = (row: ShipmentRow): Shipment => ({
  id: row.id,
  orderId: row.order_id,
  status: row.status,
  carrier: row.carrier,
  trackingNo: row.tracking_no,
  createdAt: toIso(row.created_at)
});
