import { defineConfig } from "@atlas/shared";
import { DEFAULT_PORT } from "./constants.js";

export interface CatalogConfig {
  databaseUrl: string;
  redisUrl: string;
  paymentsUrl: string;
  port: number;
}

export function loadConfig(): CatalogConfig {
  return defineConfig<CatalogConfig>({
    databaseUrl: { env: "DATABASE_URL", required: true },
    redisUrl: { env: "REDIS_URL", required: true },
    paymentsUrl: { env: "PAYMENTS_URL", required: true },
    port: {
      env: "PORT",
      default: String(DEFAULT_PORT),
      parse: (raw) => Number.parseInt(raw, 10)
    }
  });
}
