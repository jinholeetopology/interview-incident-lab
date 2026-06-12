import { defineConfig } from '@atlas/shared';
import type { DownstreamServiceName } from './constants/services.js';

export interface GatewayConfig {
  port: number;
  redisUrl: string;
  apiKeys: string[];
  catalogUrl: string;
  inventoryUrl: string;
  ordersUrl: string;
  paymentsUrl: string;
  settlementUrl: string;
}

export type DownstreamUrls = Record<DownstreamServiceName, string>;

const parsePort = (raw: string): number => {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return port;
};

const parseApiKeys = (raw: string): string[] => {
  const keys = raw
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  if (keys.length === 0) {
    throw new Error('GATEWAY_API_KEYS must contain at least one key');
  }

  return [...new Set(keys)];
};

export const loadConfig = (): GatewayConfig =>
  defineConfig<GatewayConfig>({
    port: { env: 'PORT', default: '8080', parse: parsePort },
    redisUrl: { env: 'REDIS_URL', required: true },
    apiKeys: { env: 'GATEWAY_API_KEYS', required: true, parse: parseApiKeys },
    catalogUrl: { env: 'CATALOG_URL', required: true },
    inventoryUrl: { env: 'INVENTORY_URL', required: true },
    ordersUrl: { env: 'ORDERS_URL', required: true },
    paymentsUrl: { env: 'PAYMENTS_URL', required: true },
    settlementUrl: { env: 'SETTLEMENT_URL', required: true }
  });

export const downstreamUrlsFromConfig = (config: GatewayConfig): DownstreamUrls => ({
  catalog: config.catalogUrl,
  inventory: config.inventoryUrl,
  orders: config.ordersUrl,
  payments: config.paymentsUrl,
  settlement: config.settlementUrl
});
