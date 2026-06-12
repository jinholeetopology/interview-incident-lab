import type { Request, Response } from "express";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@atlas/shared";
import type { SettlementsRepo } from "../repositories/settlementsRepo.js";

const runSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function settlementsController(settlements: SettlementsRepo) {
  return {
    async run(req: Request, res: Response) {
      const parsed = runSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
      }
      if (parsed.data.periodEnd < parsed.data.periodStart) {
        throw new ValidationError("periodEnd must not precede periodStart");
      }
      const settlement = await settlements.runDraft(parsed.data.periodStart, parsed.data.periodEnd);
      res.status(201).json(settlement);
    },

    async getById(req: Request, res: Response) {
      const settlement = await settlements.findById(req.params.id!);
      if (!settlement) throw new NotFoundError("settlement not found");
      res.status(200).json(settlement);
    },
  };
}
