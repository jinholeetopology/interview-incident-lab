import { createLogger } from "@atlas/shared";
import { createAlertEmitter } from "./alerts.js";
import { loadConfig } from "./config.js";
import { loadFixtures } from "./fixtures/loadFixtures.js";
import { GatewayClient } from "./gatewayClient.js";
import { startScheduler } from "./runtime/scheduler.js";
import { buildScenarioSchedule } from "./scenarios/index.js";
import { createScenarioState } from "./state.js";

const config = loadConfig();
const logger = createLogger("synthetic-monitor");
const fixtures = await loadFixtures();
const alerts = createAlertEmitter(logger);
const client = new GatewayClient({
  baseUrl: config.gatewayUrl,
  apiKey: config.apiKey,
  timeoutMs: config.timeoutMs
});

const scheduler = startScheduler({
  logger,
  intervalMs: config.cycleIntervalMs,
  scenarios: buildScenarioSchedule(config.cycleIntervalMs),
  context: {
    logger,
    client,
    alerts,
    fixtures,
    state: createScenarioState()
  }
});

logger.info("synthetic_monitor_started", {
  gatewayUrl: config.gatewayUrl,
  cycleIntervalMs: config.cycleIntervalMs
});

const shutdown = (signal: string) => {
  logger.info("synthetic_monitor_stopping", { signal });
  scheduler.stop();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
