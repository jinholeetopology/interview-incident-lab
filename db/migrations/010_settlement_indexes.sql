CREATE INDEX IF NOT EXISTS idx_settlement_ledger_created ON settlement.ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_settlement_ledger_order ON settlement.ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_entry ON settlement.settlement_lines(ledger_entry_id);
