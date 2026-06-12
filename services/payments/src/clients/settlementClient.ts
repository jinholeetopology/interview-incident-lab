import { serviceClient, withRetry, AppError, UpstreamError, type Logger } from "@atlas/shared";

export interface LedgerEntryInput {
  account: string;
  orderId?: string;
  paymentIntentId?: string;
  amountCents: number;
  currency: string;
  entryType: "charge" | "refund" | "fee" | "payout";
  externalRef?: string;
}

export function settlementClient(baseUrl: string, logger: Logger) {
  const client = serviceClient({ baseUrl, service: "settlement" });

  return {
    async postLedgerEntry(entry: LedgerEntryInput): Promise<void> {
      try {
        await withRetry(() => client.post("/ledger/entries", entry), {
          retries: 3,
          baseDelayMs: 100,
        });
      } catch (err) {
        if (err instanceof UpstreamError) {
          logger.warn("settlement ledger post failed", {
            account: entry.account,
            paymentIntentId: entry.paymentIntentId,
            status: err.status,
          });
          throw new AppError("LEDGER_POST_FAILED", 502, "failed to record ledger entry");
        }
        throw err;
      }
    },
  };
}

export type SettlementClient = ReturnType<typeof settlementClient>;
