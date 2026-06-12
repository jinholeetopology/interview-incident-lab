import express from "express";
import {
  accessLog,
  errorHandler,
  healthRouter,
  requestId,
  type Cache,
  type Db,
  type Logger,
} from "@atlas/shared";
import { ledgerRepo } from "./repositories/ledgerRepo.js";
import { settlementsRepo } from "./repositories/settlementsRepo.js";
import { ledgerController } from "./controllers/ledgerController.js";
import { settlementsController } from "./controllers/settlementsController.js";
import { settlementRoutes } from "./routes/settlementRoutes.js";

export interface AppDeps {
  db: Db;
  cache: Cache;
  logger: Logger;
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.use(express.json());
  app.use(requestId());
  app.use(accessLog(deps.logger));

  const ledger = ledgerRepo(deps.db);
  const settlements = settlementsRepo(deps.db);

  app.use(
    healthRouter([
      { name: "postgres", check: async () => { await deps.db.query("SELECT 1"); } },
      { name: "redis", check: async () => { await deps.cache.set("settlement:ready-probe", 1, 5); } },
    ]),
  );
  app.use(settlementRoutes(ledgerController(ledger), settlementsController(settlements)));
  app.use(errorHandler(deps.logger));
  return app;
}
