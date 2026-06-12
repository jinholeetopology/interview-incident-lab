import { vi } from "vitest";
import type { Cache, Logger } from "@atlas/shared";
import type { CatalogClient } from "../src/clients/catalogClient.js";
import type { InventoryClient } from "../src/clients/inventoryClient.js";
import type { PaymentsClient } from "../src/clients/paymentsClient.js";
import type {
  CustomerRepository,
  OrderRepository
} from "../src/repositories/index.js";
import type { Customer, Order } from "../src/domain/models.js";
import type { PlaceOrderDeps } from "../src/domain/placeOrderTypes.js";

export const customerFixture: Customer = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "CUST-001",
  name: "Northwind Retail",
  tier: "gold",
  country: "US",
  currency: "USD"
};

export const orderFixture = (status: Order["status"], id = "order-1"): Order => ({
  id,
  customerId: customerFixture.id,
  status,
  currency: "USD",
  subtotalCents: 2400,
  totalCents: 2400,
  reservationId: status === "pending" ? null : "reservation-1",
  paymentIntentId:
    status === "pending" || status === "reserved" ? null : "payment-intent-1",
  placedAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:01.000Z",
  items: [
    {
      id: "item-1",
      orderId: id,
      productId: "22222222-2222-4222-8222-222222222222",
      qty: 2,
      unitPriceCents: 1200,
      lineTotalCents: 2400
    }
  ]
});

export const loggerFixture = (): Logger =>
  ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => loggerFixture())
  }) as unknown as Logger;

export const cacheFixture = (): Cache =>
  ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(async () => undefined),
    withCache: vi.fn(async <T>(_key: string, _ttl: number, loader: () => Promise<T>) =>
      loader()
    ),
    close: vi.fn()
  }) as unknown as Cache;

export const makePlaceOrderDeps = (
  overrides: Partial<PlaceOrderDeps> = {}
): PlaceOrderDeps => {
  const customers: CustomerRepository = {
    findById: vi.fn(async () => customerFixture)
  };

  const orders: OrderRepository = {
    createPending: vi.fn(async () => orderFixture("pending")),
    findById: vi.fn(async () => orderFixture("confirmed")),
    findByIdOrThrow: vi.fn(async () => orderFixture("confirmed")),
    findByIdForUpdate: vi.fn(async () => orderFixture("confirmed")),
    list: vi.fn(),
    markReserved: vi.fn(async () => orderFixture("reserved")),
    attachPaymentIntent: vi.fn(async () => ({
      ...orderFixture("reserved"),
      paymentIntentId: "payment-intent-1"
    })),
    markConfirmed: vi.fn(async () => orderFixture("confirmed")),
    markFailed: vi.fn(async () => orderFixture("failed")),
    markCancelled: vi.fn(async () => orderFixture("cancelled")),
    markShipped: vi.fn(async () => orderFixture("shipped"))
  };

  const catalog: CatalogClient = {
    getProduct: vi.fn(async () => ({
      id: "22222222-2222-4222-8222-222222222222",
      sku: "SKU-001",
      name: "Widget",
      description: "Wholesale widget",
      categoryId: "33333333-3333-4333-8333-333333333333",
      basePriceCents: 1200,
      currency: "USD",
      status: "active",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z"
    })),
    getPrice: vi.fn(async () => ({
      productId: "22222222-2222-4222-8222-222222222222",
      currency: "USD",
      qty: 2,
      unitPriceCents: 1200,
      appliedRuleIds: ["rule-1"]
    })),
    checkReady: vi.fn()
  };

  const inventory: InventoryClient = {
    createReservation: vi.fn(async () => ({
      id: "reservation-1",
      status: "pending",
      lines: [
        {
          productId: "22222222-2222-4222-8222-222222222222",
          warehouseId: "warehouse-1",
          qty: 2
        }
      ]
    })),
    commitReservation: vi.fn(async () => undefined),
    releaseReservation: vi.fn(async () => undefined),
    checkReady: vi.fn()
  };

  const payments: PaymentsClient = {
    createIntent: vi.fn(async () => ({
      id: "payment-intent-1",
      orderId: "order-1",
      amountCents: 2400,
      currency: "USD",
      status: "requires_capture",
      idempotencyKey: "order:order-1",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z"
    })),
    captureIntent: vi.fn(async () => ({
      id: "payment-intent-1",
      orderId: "order-1",
      amountCents: 2400,
      currency: "USD",
      status: "succeeded",
      idempotencyKey: "order:order-1",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z"
    })),
    voidIntent: vi.fn(async () => ({
      id: "payment-intent-1",
      orderId: "order-1",
      amountCents: 2400,
      currency: "USD",
      status: "voided",
      idempotencyKey: "order:order-1",
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z"
    })),
    checkReady: vi.fn()
  };

  return {
    customers,
    orders,
    catalog,
    inventory,
    payments,
    cache: cacheFixture(),
    logger: loggerFixture(),
    ...overrides
  };
};
