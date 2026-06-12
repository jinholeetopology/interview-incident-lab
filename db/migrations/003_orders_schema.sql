CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS orders.customers (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('standard', 'gold', 'platinum')),
  country text NOT NULL,
  currency text NOT NULL
);

CREATE TABLE IF NOT EXISTS orders.orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES orders.customers(id),
  status text NOT NULL CHECK (status IN ('pending', 'reserved', 'confirmed', 'shipped', 'cancelled', 'failed')),
  currency text NOT NULL,
  subtotal_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  reservation_id uuid NULL,
  payment_intent_id uuid NULL,
  placed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders.order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  qty int NOT NULL,
  unit_price_cents bigint NOT NULL,
  line_total_cents bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS orders.shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('preparing', 'dispatched', 'delivered')),
  carrier text NOT NULL,
  tracking_no text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
