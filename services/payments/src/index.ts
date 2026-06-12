import { createCache, createIdempotency, createLogger, createPool } from "@atlas/shared";
import { loadConfig } from "./config.js";
import { createApp } from "./app.js";

const config = loadConfig();
const logger = createLogger("payments");
const db = createPool({ connectionString: config.databaseUrl, schema: "payments" });
const cache = createCache({ url: config.redisUrl, prefix: "payments" });
const idempotency = createIdempotency(cache);

const app = createApp({
  db,
  cache,
  idempotency,
  logger,
  settlementUrl: config.settlementUrl,
  pspFailRate: config.pspFailRate,
});

const server = app.listen(config.port, () => {
  logger.info("payments listening", { port: config.port });
});

async function shutdown(signal: string) {
  logger.info("shutting down", { signal });
  server.close(async () => {
    await db.close();
    await cache.close();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
