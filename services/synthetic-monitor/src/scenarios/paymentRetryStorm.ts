import { alertOnHttpError } from "../invariants/http.js";
import { deterministicUuid } from "../runtime/deterministic.js";
import type { PaymentIntentResponse, Scenario } from "../types.js";

export const paymentRetryStormScenario: Scenario = {
  name: "payment-retry-storm",
  async run(ctx) {
    const cycle = ctx.state.cycle;
    const orderId = deterministicUuid(`payment-order-${cycle}`);
    const intent = await ctx.client.post<PaymentIntentResponse>("/api/payments/intents", {
      orderId,
      amountCents: 24_500,
      currency: "USD",
      idempotencyKey: `synthetic-intent-${cycle}`
    });
    if (alertOnHttpError(ctx.alerts, intent)) {
      return;
    }

    ctx.state.lastPaymentIntentIds.push(intent.body.id);
    const captures = await Promise.all(
      Array.from({ length: 6 }, () =>
        ctx.client.post<PaymentIntentResponse>(`/api/payments/intents/${intent.body.id}/capture`, {
          idempotencyKey: `synthetic-capture-${cycle}`
        })
      )
    );

    const providerRefs = new Set<string>();
    for (const capture of captures) {
      if (alertOnHttpError(ctx.alerts, capture)) {
        continue;
      }
      if (capture.body.providerRef) {
        providerRefs.add(capture.body.providerRef);
      }
    }

    if (providerRefs.size > 1) {
      ctx.alerts.emit("duplicate_charge", {
        orderId,
        chargeCount: providerRefs.size
      });
    }
  }
};
