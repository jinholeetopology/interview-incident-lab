CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE IF NOT EXISTS inventory.warehouses (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory.stock_levels (
  warehouse_id uuid NOT NULL REFERENCES inventory.warehouses(id),
  product_id uuid NOT NULL,
  on_hand int NOT NULL,
  reserved int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_reservations (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'committed', 'released')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.stock_reservation_lines (
  id uuid PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES inventory.stock_reservations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES inventory.warehouses(id),
  qty int NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
  id uuid PRIMARY KEY,
  warehouse_id uuid NOT NULL REFERENCES inventory.warehouses(id),
  product_id uuid NOT NULL,
  delta int NOT NULL,
  reason text NOT NULL,
  ref_type text NOT NULL,
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
