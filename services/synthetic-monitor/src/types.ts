import type { Logger } from "@atlas/shared";
import type { AlertEmitter } from "./alerts.js";
import type { GatewayClient } from "./gatewayClient.js";
import type { FixtureDocument } from "./fixtures/loadFixtures.js";
import type { ScenarioState } from "./state.js";

export type JsonObject = Record<string, unknown>;

export type HttpResult<T = unknown> = {
  path: string;
  status: number;
  ok: boolean;
  body: T;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
};

export type ProductSummary = {
  id: string;
  sku?: string;
  name?: string;
  basePriceCents?: number;
  currency?: string;
  status?: string;
};

export type PriceQuote = {
  productId: string;
  currency: string;
  qty: number;
  unitPriceCents: number;
  appliedRuleIds: string[];
};

export type OrderResponse = {
  id: string;
  status: string;
  currency: string;
  subtotalCents?: number;
  totalCents?: number;
  paymentIntentId?: string;
};

export type PaymentIntentResponse = {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  providerRef?: string;
};

export type ScenarioContext = {
  logger: Logger;
  client: GatewayClient;
  alerts: AlertEmitter;
  fixtures: FixtureDocument;
  state: ScenarioState;
};

export type Scenario = {
  name: string;
  run(ctx: ScenarioContext): Promise<void>;
};
