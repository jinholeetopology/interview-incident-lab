import { defineConfig } from "@atlas/shared";

export interface OrdersRuntimeConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  catalogUrl: string;
  inventoryUrl: string;
  paymentsUrl: string;
  serviceTimeoutMs: number;
  shipmentJobIntervalMs: number;
}

const parsePort = (raw: string): number => {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return port;
};

const parseMs = (raw: string): number => {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid millisecond value: ${raw}`);
  }
  return value;
};

export const config = defineConfig<OrdersRuntimeConfig>({
  port: { env: "PORT", default: "7004", parse: parsePort },
  databaseUrl: { env: "DATABASE_URL", required: true },
  redisUrl: { env: "REDIS_URL", required: true },
  catalogUrl: { env: "CATALOG_URL", required: true },
  inventoryUrl: { env: "INVENTORY_URL", required: true },
  paymentsUrl: { env: "PAYMENTS_URL", required: true },
  serviceTimeoutMs: { env: "SERVICE_TIMEOUT_MS", default: "2000", parse: parseMs },
  shipmentJobIntervalMs: {
    env: "SHIPMENT_JOB_INTERVAL_MS",
    default: "2500",
    parse: parseMs
  }
});
