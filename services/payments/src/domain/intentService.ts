import { ConflictError, NotFoundError, type Idempotency } from "@atlas/shared";
import type { IntentsRepo } from "../repositories/intentsRepo.js";
import type { PaymentIntent } from "../types.js";

const CREATE_TTL_SEC = 24 * 60 * 60;

export function intentService(intents: IntentsRepo, idempotency: Idempotency) {
  return {
    async create(input: {
      orderId: string;
      amountCents: number;
      currency: string;
      idempotencyKey: string;
    }): Promise<PaymentIntent> {
      const { result } = await idempotency.run(
        `intent:${input.idempotencyKey}`,
        CREATE_TTL_SEC,
        async () => {
          const existing = await intents.findByIdempotencyKey(input.idempotencyKey);
          if (existing) return existing;
          return intents.create(input);
        },
      );
      return result;
    },

    async getById(id: string): Promise<PaymentIntent> {
      const intent = await intents.findById(id);
      if (!intent) throw new NotFoundError("payment intent not found");
      return intent;
    },

    async void(id: string): Promise<PaymentIntent> {
      const intent = await intents.findById(id);
      if (!intent) throw new NotFoundError("payment intent not found");
      if (intent.status === "voided") return intent;
      const updated = await intents.updateStatus(id, ["requires_capture", "processing"], "voided");
      if (!updated) throw new ConflictError(`intent is ${intent.status}`);
      return updated;
    },
  };
}

export type IntentService = ReturnType<typeof intentService>;
