import { randomUUID } from "node:crypto";
import type { Db } from "@atlas/shared";
import type { IntentStatus, PaymentIntent } from "../types.js";

interface IntentRow {
  id: string;
  order_id: string;
  amount_cents: string;
  currency: string;
  status: IntentStatus;
  idempotency_key: string;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: IntentRow): PaymentIntent {
  return {
    id: row.id,
    orderId: row.order_id,
    amountCents: Number(row.amount_cents),
    currency: row.currency,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function intentsRepo(db: Db) {
  return {
    async create(input: {
      orderId: string;
      amountCents: number;
      currency: string;
      idempotencyKey: string;
    }): Promise<PaymentIntent> {
      const rows = await db.query<IntentRow>(
        `INSERT INTO payments.payment_intents
           (id, order_id, amount_cents, currency, status, idempotency_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'requires_capture', $5, now(), now())
         RETURNING *`,
        [randomUUID(), input.orderId, input.amountCents, input.currency, input.idempotencyKey],
      );
      return mapRow(rows[0]!);
    },

    async findById(id: string): Promise<PaymentIntent | null> {
      const rows = await db.query<IntentRow>(
        `SELECT * FROM payments.payment_intents WHERE id = $1`,
        [id],
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async findByIdempotencyKey(key: string): Promise<PaymentIntent | null> {
      const rows = await db.query<IntentRow>(
        `SELECT * FROM payments.payment_intents WHERE idempotency_key = $1`,
        [key],
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async updateStatus(id: string, from: IntentStatus[], to: IntentStatus): Promise<PaymentIntent | null> {
      const rows = await db.query<IntentRow>(
        `UPDATE payments.payment_intents
            SET status = $2, updated_at = now()
          WHERE id = $1 AND status = ANY($3)
          RETURNING *`,
        [id, to, from],
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },
  };
}

export type IntentsRepo = ReturnType<typeof intentsRepo>;
