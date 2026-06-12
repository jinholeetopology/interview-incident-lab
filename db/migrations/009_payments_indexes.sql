CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_intents_idempotency
  ON payments.payment_intents(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_attempts_intent ON payments.payment_attempts(intent_id);
