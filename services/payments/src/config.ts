import { defineConfig } from "@atlas/shared";

export interface PaymentsConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  settlementUrl: string;
  pspFailRate: number;
  logLevel: string;
}

export function loadConfig(): PaymentsConfig {
  return defineConfig<PaymentsConfig>({
    port: { env: "PORT", default: "7005", parse: (raw) => Number(raw) },
    databaseUrl: { env: "DATABASE_URL", required: true },
    redisUrl: { env: "REDIS_URL", required: true },
    settlementUrl: { env: "SETTLEMENT_URL", required: true },
    pspFailRate: { env: "PSP_FAIL_RATE", default: "0", parse: (raw) => Number(raw) },
    logLevel: { env: "LOG_LEVEL", default: "info" },
  });
}
