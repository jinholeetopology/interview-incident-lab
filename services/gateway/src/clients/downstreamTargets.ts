import type { DownstreamServiceName } from '../constants/services.js';
import type { DownstreamUrls } from '../config.js';

export interface DownstreamTarget {
  name: DownstreamServiceName;
  baseUrl: string;
}

export const createDownstreamTargets = (urls: DownstreamUrls): Record<DownstreamServiceName, DownstreamTarget> => ({
  catalog: { name: 'catalog', baseUrl: urls.catalog },
  inventory: { name: 'inventory', baseUrl: urls.inventory },
  orders: { name: 'orders', baseUrl: urls.orders },
  payments: { name: 'payments', baseUrl: urls.payments },
  settlement: { name: 'settlement', baseUrl: urls.settlement }
});
