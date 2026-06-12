import { createHash } from "node:crypto";

export interface PspResult {
  ok: boolean;
  providerRef: string;
  errorCode?: string;
}

export interface PspProvider {
  capture(intentId: string, amountCents: number, currency: string): Promise<PspResult>;
}

function stableHash(input: string): number {
  const digest = createHash("sha256").update(input).digest();
  return digest.readUInt32BE(0);
}

// Deterministic pseudo-PSP: latency and outcomes derive from the intent id so
// repeated runs behave identically across environments.
export function pspProvider(opts: { failRate: number }): PspProvider {
  return {
    async capture(intentId, amountCents, currency) {
      const h = stableHash(`${intentId}:${amountCents}:${currency}`);
      const latencyMs = 30 + (h % 51);
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
      const providerRef = `psp_${createHash("sha256").update(intentId).digest("hex").slice(0, 24)}`;
      if (opts.failRate > 0 && (h % 1000) / 1000 < opts.failRate) {
        return { ok: false, providerRef, errorCode: "card_declined" };
      }
      return { ok: true, providerRef };
    },
  };
}
