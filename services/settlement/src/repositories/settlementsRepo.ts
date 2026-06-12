import { randomUUID } from "node:crypto";
import type { Db } from "@atlas/shared";

export interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "finalized";
  totalCents: number;
  createdAt: string;
  lineCount?: number;
}

interface SettlementRow {
  id: string;
  period_start: string;
  period_end: string;
  status: "draft" | "finalized";
  total_cents: string;
  created_at: Date;
}

function mapRow(row: SettlementRow): Settlement {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    totalCents: Number(row.total_cents),
    createdAt: row.created_at.toISOString(),
  };
}

export function settlementsRepo(db: Db) {
  return {
    // Draft settlement over unsettled ledger entries in the period, all in one
    // transaction so concurrent runs cannot double-collect the same entries.
    async runDraft(periodStart: string, periodEnd: string): Promise<Settlement> {
      return db.withTx(async (tx) => {
        const id = randomUUID();
        const created = await tx.query<SettlementRow>(
          `INSERT INTO settlement.settlements (id, period_start, period_end, status, total_cents, created_at)
           VALUES ($1, $2, $3, 'draft', 0, now())
           RETURNING *`,
          [id, periodStart, periodEnd],
        );
        const lines = await tx.query<{ count: string }>(
          `WITH picked AS (
             SELECT le.id AS ledger_entry_id
               FROM settlement.ledger_entries le
              WHERE le.created_at >= $2::date
                AND le.created_at < ($3::date + interval '1 day')
                AND NOT EXISTS (
                  SELECT 1 FROM settlement.settlement_lines sl WHERE sl.ledger_entry_id = le.id
                )
              FOR UPDATE OF le
           ), inserted AS (
             INSERT INTO settlement.settlement_lines (id, settlement_id, ledger_entry_id)
             SELECT gen_random_uuid(), $1, ledger_entry_id FROM picked
             RETURNING ledger_entry_id
           )
           SELECT COUNT(*)::text AS count FROM inserted`,
          [id, periodStart, periodEnd],
        );
        const totals = await tx.query<SettlementRow>(
          `UPDATE settlement.settlements s
              SET total_cents = COALESCE((
                SELECT SUM(le.amount_cents)
                  FROM settlement.settlement_lines sl
                  JOIN settlement.ledger_entries le ON le.id = sl.ledger_entry_id
                 WHERE sl.settlement_id = s.id
              ), 0)
            WHERE s.id = $1
            RETURNING *`,
          [id],
        );
        const settlement = mapRow(totals[0] ?? created[0]!);
        settlement.lineCount = Number(lines[0]?.count ?? 0);
        return settlement;
      });
    },

    async findById(id: string): Promise<Settlement | null> {
      const rows = await db.query<SettlementRow>(
        `SELECT * FROM settlement.settlements WHERE id = $1`,
        [id],
      );
      if (!rows[0]) return null;
      const settlement = mapRow(rows[0]);
      const lines = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM settlement.settlement_lines WHERE settlement_id = $1`,
        [id],
      );
      settlement.lineCount = Number(lines[0]?.count ?? 0);
      return settlement;
    },
  };
}

export type SettlementsRepo = ReturnType<typeof settlementsRepo>;
