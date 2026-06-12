import express from "express";
import {
  accessLog,
  errorHandler,
  healthRouter,
  requestId,
  type Cache,
  type Db,
  type Idempotency,
  type Logger,
} from "@atlas/shared";
import { intentsRepo } from "./repositories/intentsRepo.js";
import { attemptsRepo } from "./repositories/attemptsRepo.js";
import { fxRepo } from "./repositories/fxRepo.js";
import { pspProvider } from "./provider/pspProvider.js";
import { settlementClient } from "./clients/settlementClient.js";
import { intentService } from "./domain/intentService.js";
import { captureIntentUseCase } from "./domain/captureIntent.js";
import { fxService } from "./domain/fxService.js";
import { intentsController } from "./controllers/intentsController.js";
import { fxController } from "./controllers/fxController.js";
import { intentsRoutes } from "./routes/intentsRoutes.js";
import { fxRoutes } from "./routes/fxRoutes.js";

export interface AppDeps {
  db: Db;
  cache: Cache;
  idempotency: Idempotency;
  logger: Logger;
  settlementUrl: string;
  pspFailRate: number;
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.use(express.json());
  app.use(requestId());
  app.use(accessLog(deps.logger));

  const intents = intentsRepo(deps.db);
  const attempts = attemptsRepo(deps.db);
  const fx = fxRepo(deps.db);
  const provider = pspProvider({ failRate: deps.pspFailRate });
  const settlement = settlementClient(deps.settlementUrl, deps.logger);

  const intentSvc = intentService(intents, deps.idempotency);
  const captureUseCase = captureIntentUseCase({
    intents,
    attempts,
    provider,
    settlement,
    idempotency: deps.idempotency,
    logger: deps.logger,
  });
  const fxSvc = fxService(fx, deps.cache);

  app.use(
    healthRouter([
      { name: "postgres", check: async () => { await deps.db.query("SELECT 1"); } },
      { name: "redis", check: async () => { await deps.cache.set("payments:ready-probe", 1, 5); } },
    ]),
  );
  app.use(intentsRoutes(intentsController(intentSvc, captureUseCase)));
  app.use(fxRoutes(fxController(fxSvc)));
  app.use(errorHandler(deps.logger));
  return app;
}
