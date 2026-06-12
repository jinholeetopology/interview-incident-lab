import type { RequestContext } from "../requestContext.js";

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  basePriceCents: number;
  currency: string;
  status: "active" | "discontinued";
  createdAt: string;
  updatedAt: string;
}

export interface PriceResponse {
  productId: string;
  currency: string;
  qty: number;
  unitPriceCents: number;
  appliedRuleIds: string[];
}

export interface ReservationLineResponse {
  productId: string;
  warehouseId: string;
  qty: number;
}

export interface ReservationResponse {
  id: string;
  status: "pending";
  lines: ReservationLineResponse[];
}

export interface PaymentIntentResponse {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: "requires_capture" | "processing" | "succeeded" | "failed" | "voided";
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadyClient {
  checkReady(ctx: RequestContext): Promise<void>;
}
