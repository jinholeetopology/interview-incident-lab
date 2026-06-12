-- Ledger entries written from payment provider callbacks carry the provider
-- reference; uniqueness on it is what makes ledger posting idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_external_ref_uniq
  ON settlement.ledger_entries (external_ref)
  WHERE external_ref IS NOT NULL;
