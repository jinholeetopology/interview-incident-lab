export type IntentStatus =
  | "requires_capture"
  | "processing"
  | "succeeded"
  | "failed"
  | "voided";

export interface PaymentIntent {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: IntentStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAttempt {
  id: string;
  intentId: string;
  attemptNo: number;
  status: "succeeded" | "failed";
  providerRef: string;
  errorCode: string | null;
  createdAt: string;
}

export interface FxRate {
  base: string;
  quote: string;
  rate: number;
  fetchedAt: string;
}
