import type { Db } from "@atlas/shared";
import type { FxRate } from "../types.js";

interface FxRow {
  base: string;
  quote: string;
  rate: string;
  fetched_at: Date;
}

export function fxRepo(db: Db) {
  return {
    async find(base: string, quote: string): Promise<FxRate | null> {
      const rows = await db.query<FxRow>(
        `SELECT base, quote, rate, fetched_at FROM payments.fx_rates WHERE base = $1 AND quote = $2`,
        [base, quote],
      );
      const row = rows[0];
      if (!row) return null;
      return {
        base: row.base,
        quote: row.quote,
        rate: Number(row.rate),
        fetchedAt: row.fetched_at.toISOString(),
      };
    },
  };
}

export type FxRepo = ReturnType<typeof fxRepo>;
