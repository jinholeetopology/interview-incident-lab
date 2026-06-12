import express from "express";
import { accessLog, errorHandler, healthRouter, requestId } from "@atlas/shared";
import type { InventoryDeps } from "./deps.js";
import { adjustmentRoutes } from "./routes/adjustmentRoutes.js";
import { reservationRoutes } from "./routes/reservationRoutes.js";
import { stockRoutes } from "./routes/stockRoutes.js";
import { warehouseRoutes } from "./routes/warehouseRoutes.js";

export const createApp = (deps: InventoryDeps): express.Express => {
  const app = express();

  app.use(requestId());
  app.use(accessLog(deps.logger));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    healthRouter([
      {
        name: "db",
        check: async () => {
          await deps.db.query<{ ok: number }>("SELECT 1 as ok");
        }
      },
      {
        name: "redis",
        check: async () => {
          await deps.cache.set("ready", { ok: true }, 1);
          await deps.cache.get<{ ok: boolean }>("ready");
        }
      }
    ])
  );

  app.use("/stock", stockRoutes(deps));
  app.use("/reservations", reservationRoutes(deps));
  app.use("/adjustments", adjustmentRoutes(deps));
  app.use("/warehouses", warehouseRoutes(deps));
  app.use(errorHandler(deps.logger));

  return app;
};
