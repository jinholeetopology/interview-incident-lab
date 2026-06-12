import { defineConfig } from "@atlas/shared";
import { DEFAULT_EXPIRY_INTERVAL_MS, DEFAULT_RESERVATION_TTL_SEC } from "./constants.js";

export interface InventoryConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  logLevel: string;
  reservationTtlSec: number;
  expiryIntervalMs: number;
}

const parseIntEnv = (name: string) => (raw: string): number => {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

export const loadConfig = (): InventoryConfig =>
  defineConfig<InventoryConfig>({
    port: {
      env: "PORT",
      default: "7003",
      parse: parseIntEnv("PORT")
    },
    databaseUrl: {
      env: "DATABASE_URL",
      required: true
    },
    redisUrl: {
      env: "REDIS_URL",
      required: true
    },
    logLevel: {
      env: "LOG_LEVEL",
      default: "info"
    },
    reservationTtlSec: {
      env: "RESERVATION_TTL_SEC",
      default: String(DEFAULT_RESERVATION_TTL_SEC),
      parse: parseIntEnv("RESERVATION_TTL_SEC")
    },
    expiryIntervalMs: {
      env: "RESERVATION_EXPIRY_INTERVAL_MS",
      default: String(DEFAULT_EXPIRY_INTERVAL_MS),
      parse: parseIntEnv("RESERVATION_EXPIRY_INTERVAL_MS")
    }
  });
