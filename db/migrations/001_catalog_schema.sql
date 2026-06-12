CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE IF NOT EXISTS catalog.categories (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid NULL REFERENCES catalog.categories(id)
);

CREATE TABLE IF NOT EXISTS catalog.products (
  id uuid PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES catalog.categories(id),
  base_price_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('active', 'discontinued')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.price_rules (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES catalog.products(id),
  rule_type text NOT NULL CHECK (rule_type IN ('percent_off', 'fixed_off', 'override')),
  value bigint NOT NULL,
  priority int NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
