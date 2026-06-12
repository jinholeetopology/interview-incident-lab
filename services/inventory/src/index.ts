import { createCache, createLogger, createPool } from "@atlas/shared";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { SERVICE_NAME } from "./constants.js";
import { AdjustmentService } from "./domain/adjustmentService.js";
import { ReservationService } from "./domain/reservationService.js";
import { StockService } from "./domain/stockService.js";
import { WarehouseService } from "./domain/warehouseService.js";
import { startReservationExpiryJob } from "./jobs/expireReservations.js";
import { MovementsRepository } from "./repositories/movementsRepository.js";
import { ReservationsRepository } from "./repositories/reservationsRepository.js";
import { StockLevelsRepository } from "./repositories/stockLevelsRepository.js";
import { WarehousesRepository } from "./repositories/warehousesRepository.js";

const config = loadConfig();
const logger = createLogger(SERVICE_NAME);
const db = createPool({ connectionString: config.databaseUrl, schema: "inventory" });
const cache = createCache({ url: config.redisUrl, prefix: SERVICE_NAME });

const stockLevelsRepository = new StockLevelsRepository();
const reservationsRepository = new ReservationsRepository();
const movementsRepository = new MovementsRepository();
const warehousesRepository = new WarehousesRepository();

const stockService = new StockService(db, stockLevelsRepository);
const reservationService = new ReservationService(
  db,
  stockLevelsRepository,
  reservationsRepository,
  movementsRepository,
  config.reservationTtlSec
);
const adjustmentService = new AdjustmentService(db, stockLevelsRepository, movementsRepository);
const warehouseService = new WarehouseService(db, cache, warehousesRepository);

const app = createApp({
  db,
  cache,
  logger,
  stockService,
  reservationService,
  adjustmentService,
  warehouseService
});

const expiryJob = startReservationExpiryJob({
  intervalMs: config.expiryIntervalMs,
  logger,
  reservationService
});

const server = app.listen(config.port, () => {
  logger.info("inventory service listening", { port: config.port });
});

const shutdown = async (): Promise<void> => {
  logger.info("inventory service shutting down");
  expiryJob.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await Promise.all([cache.close(), db.close()]);
};

process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});
