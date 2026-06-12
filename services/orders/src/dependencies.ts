import {
  createCache,
  createIdempotency,
  createLogger,
  createPool,
  serviceClient
} from "@atlas/shared";
import type { Cache, Db, Idempotency, Logger } from "@atlas/shared";
import { createCatalogClient, type CatalogClient } from "./clients/catalogClient.js";
import {
  createInventoryClient,
  type InventoryClient
} from "./clients/inventoryClient.js";
import {
  createPaymentsClient,
  type PaymentsClient
} from "./clients/paymentsClient.js";
import type { ControllerDeps } from "./controllers/controllerDeps.js";
import type { OrdersRuntimeConfig } from "./config.js";
import {
  createCustomerRepository,
  createOrderRepository,
  createShipmentRepository,
  createTimelineRepository,
  type CustomerRepository,
  type OrderRepository,
  type ShipmentRepository,
  type TimelineRepository
} from "./repositories/index.js";

export type OrdersConfig = OrdersRuntimeConfig;

export interface Repositories {
  customers: CustomerRepository;
  orders: OrderRepository;
  shipments: ShipmentRepository;
  timelines: TimelineRepository;
}

export interface DownstreamClients {
  catalog: CatalogClient;
  inventory: InventoryClient;
  payments: PaymentsClient;
}

export interface AppResources {
  db: Db;
  cache: Cache;
  logger: Logger;
  idempotency: Idempotency;
  repositories: Repositories;
  clients: DownstreamClients;
  controllerDeps: ControllerDeps;
  close(): Promise<void>;
}

export const createResources = (cfg: OrdersConfig): AppResources => {
  const logger = createLogger("orders");
  const db = createPool({ connectionString: cfg.databaseUrl, schema: "orders" });
  const cache = createCache({ url: cfg.redisUrl, prefix: "orders" });
  const idempotency = createIdempotency(cache);

  const catalog = createCatalogClient(
    serviceClient({
      baseUrl: cfg.catalogUrl,
      service: "catalog",
      timeoutMs: cfg.serviceTimeoutMs
    }),
    logger
  );
  const inventory = createInventoryClient(
    serviceClient({
      baseUrl: cfg.inventoryUrl,
      service: "inventory",
      timeoutMs: cfg.serviceTimeoutMs
    }),
    logger
  );
  const payments = createPaymentsClient(
    serviceClient({
      baseUrl: cfg.paymentsUrl,
      service: "payments",
      timeoutMs: cfg.serviceTimeoutMs
    }),
    logger
  );

  const repositories: Repositories = {
    customers: createCustomerRepository(db),
    orders: createOrderRepository(db),
    shipments: createShipmentRepository(db),
    timelines: createTimelineRepository(db)
  };
  const clients: DownstreamClients = { catalog, inventory, payments };

  const controllerDeps: ControllerDeps = {
    idempotency,
    placeOrder: {
      customers: repositories.customers,
      orders: repositories.orders,
      catalog,
      inventory,
      payments,
      cache,
      logger
    },
    cancelOrder: {
      db,
      orders: repositories.orders,
      shipments: repositories.shipments,
      inventory,
      payments,
      cache,
      logger
    },
    shipOrder: {
      db,
      orders: repositories.orders,
      shipments: repositories.shipments,
      cache
    },
    readOrders: {
      cache,
      orders: repositories.orders,
      shipments: repositories.shipments,
      timelines: repositories.timelines
    }
  };

  return {
    db,
    cache,
    logger,
    idempotency,
    repositories,
    clients,
    controllerDeps,
    async close() {
      await Promise.all([db.close(), cache.close()]);
    }
  };
};
