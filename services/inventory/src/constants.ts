export const SERVICE_NAME = "inventory";
export const CACHE_KEYS = {
  warehousesList: "warehouses:list"
} as const;

export const DEFAULT_RESERVATION_TTL_SEC = 600;
export const DEFAULT_EXPIRY_INTERVAL_MS = 30_000;
export const WAREHOUSE_CACHE_TTL_SEC = 300;
export const MAX_EXPIRED_RESERVATIONS_PER_TICK = 100;
