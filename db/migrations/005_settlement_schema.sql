CREATE SCHEMA IF NOT EXISTS settlement;

CREATE TABLE IF NOT EXISTS settlement.ledger_entries (
  id uuid PRIMARY KEY,
  account text NOT NULL,
  order_id uuid NULL,
  payment_intent_id uuid NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('charge', 'refund', 'fee', 'payout')),
  external_ref text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement.settlements (
  id uuid PRIMARY KEY,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'finalized')),
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement.settlement_lines (
  id uuid PRIMARY KEY,
  settlement_id uuid NOT NULL REFERENCES settlement.settlements(id) ON DELETE CASCADE,
  ledger_entry_id uuid NOT NULL REFERENCES settlement.ledger_entries(id),
  UNIQUE (settlement_id, ledger_entry_id)
);
