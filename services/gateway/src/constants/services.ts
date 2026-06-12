export const DOWNSTREAM_SERVICE_NAMES = [
  'catalog',
  'inventory',
  'orders',
  'payments',
  'settlement'
] as const;

export type DownstreamServiceName = (typeof DOWNSTREAM_SERVICE_NAMES)[number];

export interface DownstreamServiceRoute {
  name: DownstreamServiceName;
  apiPrefix: `/api/${DownstreamServiceName}`;
  configKey: `${DownstreamServiceName}Url`;
}

export const DOWNSTREAM_ROUTES: DownstreamServiceRoute[] = [
  { name: 'catalog', apiPrefix: '/api/catalog', configKey: 'catalogUrl' },
  { name: 'inventory', apiPrefix: '/api/inventory', configKey: 'inventoryUrl' },
  { name: 'orders', apiPrefix: '/api/orders', configKey: 'ordersUrl' },
  { name: 'payments', apiPrefix: '/api/payments', configKey: 'paymentsUrl' },
  { name: 'settlement', apiPrefix: '/api/settlement', configKey: 'settlementUrl' }
];
