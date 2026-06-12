import { randomUUID } from "node:crypto";
import type { Db } from "@atlas/shared";

export interface LedgerEntry {
  id: string;
  account: string;
  orderId: string | null;
  paymentIntentId: string | null;
  amountCents: number;
  currency: string;
  entryType: "charge" | "refund" | "fee" | "payout";
  externalRef: string | null;
  createdAt: string;
}

interface LedgerRow {
  id: string;
  account: string;
  order_id: string | null;
  payment_intent_id: string | null;
  amount_cents: string;
  currency: string;
  entry_type: LedgerEntry["entryType"];
  external_ref: string | null;
  created_at: Date;
}

function mapRow(row: LedgerRow): LedgerEntry {
  return {
    id: row.id,
    account: row.account,
    orderId: row.order_id,
    paymentIntentId: row.payment_intent_id,
    amountCents: Number(row.amount_cents),
    currency: row.currency,
    entryType: row.entry_type,
    externalRef: row.external_ref,
    createdAt: row.created_at.toISOString(),
  };
}

export function ledgerRepo(db: Db) {
  return {
    async insert(input: {
      account: string;
      orderId?: string | null | undefined;
      paymentIntentId?: string | null | undefined;
      amountCents: number;
      currency: string;
      entryType: LedgerEntry["entryType"];
      externalRef?: string | null | undefined;
    }): Promise<{ entry: LedgerEntry; created: boolean }> {
      if (input.externalRef) {
        const existing = await db.query<LedgerRow>(
          `SELECT * FROM settlement.ledger_entries WHERE external_ref = $1`,
          [input.externalRef],
        );
        if (existing[0]) return { entry: mapRow(existing[0]), created: false };
      }
      const rows = await db.query<LedgerRow>(
        `INSERT INTO settlement.ledger_entries
           (id, account, order_id, payment_intent_id, amount_cents, currency, entry_type, external_ref, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
         ON CONFLICT (external_ref) WHERE external_ref IS NOT NULL DO NOTHING
         RETURNING *`,
        [
          randomUUID(),
          input.account,
          input.orderId ?? null,
          input.paymentIntentId ?? null,
          input.amountCents,
          input.currency,
          input.entryType,
          input.externalRef ?? null,
        ],
      );
      if (rows[0]) return { entry: mapRow(rows[0]), created: true };
      const replay = await db.query<LedgerRow>(
        `SELECT * FROM settlement.ledger_entries WHERE external_ref = $1`,
        [input.externalRef ?? null],
      );
      return { entry: mapRow(replay[0]!), created: false };
    },

    async dailyReport(date: string): Promise<{ account: string; entryType: string; currency: string; totalCents: number; entryCount: number }[]> {
      const rows = await db.query<{
        account: string;
        entry_type: string;
        currency: string;
        total_cents: string;
        entry_count: string;
      }>(
        `SELECT account, entry_type, currency,
                SUM(amount_cents)::text AS total_cents,
                COUNT(*)::text AS entry_count
           FROM settlement.ledger_entries
          WHERE created_at >= $1::date AND created_at < ($1::date + interval '1 day')
          GROUP BY account, entry_type, currency
          ORDER BY account, entry_type, currency`,
        [date],
      );
      return rows.map((row) => ({
        account: row.account,
        entryType: row.entry_type,
        currency: row.currency,
        totalCents: Number(row.total_cents),
        entryCount: Number(row.entry_count),
      }));
    },
  };
}

export type LedgerRepo = ReturnType<typeof ledgerRepo>;
