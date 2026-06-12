import { createCache, createLogger, createPool } from "@atlas/shared";
import { createPaymentsClient } from "./clients/payments.js";
import { createApp } from "./app.js";
import { CACHE_PREFIX, CATALOG_SCHEMA, SERVICE_NAME } from "./constants.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(SERVICE_NAME);
  const db = createPool({ connectionString: config.databaseUrl, schema: CATALOG_SCHEMA });
  const cache = createCache({ url: config.redisUrl, prefix: CACHE_PREFIX });
  const payments = createPaymentsClient({ baseUrl: config.paymentsUrl, logger });
  const app = createApp({ db, cache, logger, payments });

  const server = app.listen(config.port, () => {
    logger.info("catalog service started", { port: config.port });
  });

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info("catalog service shutting down", { signal });
    server.close(async () => {
      await Promise.allSettled([db.close(), cache.close()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
