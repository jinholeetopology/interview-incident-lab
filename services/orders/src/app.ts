import express from "express";
import { accessLog, errorHandler, healthRouter, requestId } from "@atlas/shared";
import type { Cache, Db, Logger } from "@atlas/shared";
import { readyCacheKey } from "./cacheKeys.js";
import type { DownstreamClients } from "./dependencies.js";
import type { ControllerDeps } from "./controllers/controllerDeps.js";
import { ordersRoutes } from "./routes/ordersRoutes.js";
import { timelineRoutes } from "./routes/timelineRoutes.js";

export interface CreateAppDeps {
  db: Db;
  cache: Cache;
  logger: Logger;
  clients: DownstreamClients;
  controllerDeps: ControllerDeps;
}

export const createApp = (deps: CreateAppDeps): express.Express => {
  const app = express();

  app.use(requestId());
  app.use(accessLog(deps.logger));
  app.use(express.json({ limit: "1mb" }));

  app.use(
    healthRouter([
      {
        name: "db",
        check: async () => {
          await deps.db.query("select 1");
        }
      },
      {
        name: "redis",
        check: async () => {
          await deps.cache.set(readyCacheKey(), { ok: true }, 1);
          await deps.cache.del(readyCacheKey());
        }
      },
      {
        name: "catalog",
        check: () => deps.clients.catalog.checkReady({})
      },
      {
        name: "inventory",
        check: () => deps.clients.inventory.checkReady({})
      },
      {
        name: "payments",
        check: () => deps.clients.payments.checkReady({})
      }
    ])
  );

  app.use("/orders/:id/timeline", timelineRoutes(deps.controllerDeps));
  app.use("/orders", ordersRoutes(deps.controllerDeps));

  app.use(errorHandler(deps.logger));

  return app;
};
