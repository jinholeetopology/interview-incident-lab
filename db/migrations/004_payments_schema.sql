CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.payment_intents (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('requires_capture', 'processing', 'succeeded', 'failed', 'voided')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments.payment_attempts (
  id uuid PRIMARY KEY,
  intent_id uuid NOT NULL REFERENCES payments.payment_intents(id) ON DELETE CASCADE,
  attempt_no int NOT NULL,
  status text NOT NULL CHECK (status IN ('succeeded', 'failed')),
  provider_ref text NOT NULL,
  error_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (intent_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS payments.fx_rates (
  base text NOT NULL,
  quote text NOT NULL,
  rate numeric(18, 8) NOT NULL,
  fetched_at timestamptz NOT NULL,
  PRIMARY KEY (base, quote)
);
