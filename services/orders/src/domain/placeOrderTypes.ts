import type { Cache, Logger } from "@atlas/shared";
import type { CatalogClient } from "../clients/catalogClient.js";
import type { InventoryClient } from "../clients/inventoryClient.js";
import type { PaymentsClient } from "../clients/paymentsClient.js";
import type { RequestContext } from "../requestContext.js";
import type { CustomerRepository, OrderRepository } from "../repositories/index.js";
import type { Order } from "./models.js";

export interface PlaceOrderLineInput {
  productId: string;
  qty: number;
}

export interface PlaceOrderInput {
  customerId: string;
  lines: PlaceOrderLineInput[];
}

export interface PricedOrderLine {
  productId: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface PlaceOrderDeps {
  customers: CustomerRepository;
  orders: OrderRepository;
  catalog: CatalogClient;
  inventory: InventoryClient;
  payments: PaymentsClient;
  cache: Cache;
  logger: Logger;
}

export interface PlaceOrderResult {
  order: Order;
}

export interface CompensationState {
  orderId: string;
  reservationId?: string;
  paymentIntentId?: string;
  ctx: RequestContext;
}
