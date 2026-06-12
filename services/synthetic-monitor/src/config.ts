import { defineConfig } from "@atlas/shared";

export type MonitorConfig = {
  gatewayUrl: string;
  apiKey: string;
  cycleIntervalMs: number;
  timeoutMs: number;
};

export const loadConfig = () =>
  defineConfig<MonitorConfig>({
    gatewayUrl: { env: "GATEWAY_URL", default: "http://gateway:8080" },
    apiKey: { env: "API_KEY", default: "demo-key-1" },
    cycleIntervalMs: {
      env: "CYCLE_INTERVAL_MS",
      default: "15000",
      parse: (raw) => Number.parseInt(raw, 10)
    },
    timeoutMs: {
      env: "HTTP_TIMEOUT_MS",
      default: "2500",
      parse: (raw) => Number.parseInt(raw, 10)
    }
  });
