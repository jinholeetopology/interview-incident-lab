import type { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "@atlas/shared";
import type { IntentService } from "../domain/intentService.js";
import type { captureIntentUseCase } from "../domain/captureIntent.js";

const createIntentSchema = z.object({
  orderId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  idempotencyKey: z.string().min(1).max(200),
});

const captureSchema = z.object({
  idempotencyKey: z.string().min(1).max(200),
});

export function intentsController(
  intents: IntentService,
  capture: ReturnType<typeof captureIntentUseCase>,
) {
  return {
    async create(req: Request, res: Response) {
      const parsed = createIntentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
      }
      const intent = await intents.create(parsed.data);
      res.status(201).json(intent);
    },

    async capture(req: Request, res: Response) {
      const parsed = captureSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues.map((i) => i.message).join("; "));
      }
      const intent = await capture(req.params.id!, parsed.data.idempotencyKey);
      res.status(200).json(intent);
    },

    async void(req: Request, res: Response) {
      const intent = await intents.void(req.params.id!);
      res.status(200).json(intent);
    },

    async getById(req: Request, res: Response) {
      const intent = await intents.getById(req.params.id!);
      res.status(200).json(intent);
    },
  };
}
