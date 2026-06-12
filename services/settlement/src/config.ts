import { defineConfig } from "@atlas/shared";

export interface SettlementConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  logLevel: string;
}

export function loadConfig(): SettlementConfig {
  return defineConfig<SettlementConfig>({
    port: { env: "PORT", default: "7006", parse: (raw) => Number(raw) },
    databaseUrl: { env: "DATABASE_URL", required: true },
    redisUrl: { env: "REDIS_URL", required: true },
    logLevel: { env: "LOG_LEVEL", default: "info" },
  });
}
