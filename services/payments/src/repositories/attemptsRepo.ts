import { randomUUID } from "node:crypto";
import type { Db } from "@atlas/shared";
import type { PaymentAttempt } from "../types.js";

interface AttemptRow {
  id: string;
  intent_id: string;
  attempt_no: number;
  status: "succeeded" | "failed";
  provider_ref: string;
  error_code: string | null;
  created_at: Date;
}

export function attemptsRepo(db: Db) {
  return {
    async record(input: {
      intentId: string;
      status: "succeeded" | "failed";
      providerRef: string;
      errorCode?: string | null;
    }): Promise<PaymentAttempt> {
      const rows = await db.query<AttemptRow>(
        `INSERT INTO payments.payment_attempts
           (id, intent_id, attempt_no, status, provider_ref, error_code, created_at)
         SELECT $1, $2, COALESCE(MAX(attempt_no), 0) + 1, $3, $4, $5, now()
           FROM payments.payment_attempts WHERE intent_id = $2
         RETURNING *`,
        [randomUUID(), input.intentId, input.status, input.providerRef, input.errorCode ?? null],
      );
      const row = rows[0]!;
      return {
        id: row.id,
        intentId: row.intent_id,
        attemptNo: row.attempt_no,
        status: row.status,
        providerRef: row.provider_ref,
        errorCode: row.error_code,
        createdAt: row.created_at.toISOString(),
      };
    },

    async countForIntent(intentId: string): Promise<number> {
      const rows = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM payments.payment_attempts WHERE intent_id = $1`,
        [intentId],
      );
      return Number(rows[0]?.count ?? 0);
    },
  };
}

export type AttemptsRepo = ReturnType<typeof attemptsRepo>;
