import type { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "@atlas/shared";
import type { LedgerRepo } from "../repositories/ledgerRepo.js";

const entrySchema = z.object({
  account: z.string().min(1).max(100),
  orderId: z.string().uuid().optional(),
  paymentIntentId: z.string().uuid().optional(),
  amountCents: z.number().int(),
  currency: z.string().length(3),
  entryType: z.enum(["charge", "refund", "fee", "payout"]),
  externalRef: z.string().min(1).max(200).optional(),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ledgerController(ledger: LedgerRepo) {
  return {
    async createEntry(req: Request, res: Response) {
      const parsed = entrySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
      }
      const { entry, created } = await ledger.insert(parsed.data);
      res.status(created ? 201 : 200).json(entry);
    },

    async dailyReport(req: Request, res: Response) {
      const date = String(req.query.date ?? "");
      if (!DATE_RE.test(date)) {
        throw new ValidationError("date must be YYYY-MM-DD");
      }
      const rows = await ledger.dailyReport(date);
      res.status(200).json({ date, totals: rows });
    },
  };
}
