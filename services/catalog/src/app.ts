import express from "express";
import { accessLog, errorHandler, healthRouter, requestId } from "@atlas/shared";
import type { CatalogDeps } from "./deps.js";
import { createCatalogServices } from "./deps.js";
import { createCatalogRouter } from "./routes/index.js";
import { catalogHealthChecks } from "./routes/health.js";

export function createApp(deps: CatalogDeps): express.Express {
  const app = express();
  const services = createCatalogServices(deps);

  app.use(requestId());
  app.use(express.json({ limit: "1mb" }));
  app.use(accessLog(deps.logger));
  app.use(healthRouter(catalogHealthChecks(deps)));
  app.use(createCatalogRouter(services));
  app.use(errorHandler(deps.logger));

  return app;
}
