import { createServer } from "node:http";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { createResources } from "./dependencies.js";
import { startShipmentProgressJob } from "./jobs/shipmentProgressJob.js";

const resources = createResources(config);
const app = createApp({
  db: resources.db,
  cache: resources.cache,
  logger: resources.logger,
  clients: resources.clients,
  controllerDeps: resources.controllerDeps
});

const server = createServer(app);
const shipmentJob = startShipmentProgressJob(
  {
    shipments: resources.repositories.shipments,
    cache: resources.cache,
    logger: resources.logger
  },
  config.shipmentJobIntervalMs
);

server.listen(config.port, () => {
  resources.logger.info("orders service listening", { port: config.port });
});

const shutdown = async (signal: string): Promise<void> => {
  resources.logger.info("orders service shutting down", { signal });
  shipmentJob.stop();
  server.close(async () => {
    await resources.close();
    process.exit(0);
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
