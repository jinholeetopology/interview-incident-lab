import type { Logger, ServiceClient } from "@atlas/shared";
import { withRetry } from "@atlas/shared";
import type { RequestContext } from "../requestContext.js";
import type { PaymentIntentResponse, ReadyClient } from "./types.js";
import { isUpstreamError, logAndMapUpstream } from "./upstream.js";

export interface PaymentsClient extends ReadyClient {
  createIntent(
    input: {
      orderId: string;
      amountCents: number;
      currency: string;
      idempotencyKey: string;
    },
    ctx: RequestContext
  ): Promise<PaymentIntentResponse>;
  captureIntent(
    intentId: string,
    input: { idempotencyKey: string },
    ctx: RequestContext
  ): Promise<PaymentIntentResponse>;
  voidIntent(intentId: string, ctx: RequestContext): Promise<PaymentIntentResponse>;
}

export const createPaymentsClient = (
  client: ServiceClient,
  logger: Logger
): PaymentsClient => ({
  async createIntent(input, ctx) {
    try {
      return await client.post<PaymentIntentResponse>("/intents", input);
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "payments",
          "intent create",
          { ...ctx, orderId: input.orderId },
          "PAYMENT_INTENT_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async captureIntent(intentId, input, ctx) {
    try {
      return await client.post<PaymentIntentResponse>(
        `/intents/${encodeURIComponent(intentId)}/capture`,
        input
      );
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "payments",
          "intent capture",
          { ...ctx, paymentIntentId: intentId },
          "PAYMENT_CAPTURE_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async voidIntent(intentId, ctx) {
    try {
      return await client.post<PaymentIntentResponse>(
        `/intents/${encodeURIComponent(intentId)}/void`
      );
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "payments",
          "intent void",
          { ...ctx, paymentIntentId: intentId },
          "PAYMENT_VOID_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async checkReady(ctx) {
    try {
      await withRetry(() => client.get("/ready"), { retries: 2, baseDelayMs: 25 });
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "payments",
          "ready check",
          ctx,
          "PAYMENTS_READY_FAILED"
        );
      }
      throw err;
    }
  }
});
