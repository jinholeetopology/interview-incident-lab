import { createCache, createLogger, createPool } from "@atlas/shared";
import { loadConfig } from "./config.js";
import { createApp } from "./app.js";

const config = loadConfig();
const logger = createLogger("settlement");
const db = createPool({ connectionString: config.databaseUrl, schema: "settlement" });
const cache = createCache({ url: config.redisUrl, prefix: "settlement" });

const app = createApp({ db, cache, logger });

const server = app.listen(config.port, () => {
  logger.info("settlement listening", { port: config.port });
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
