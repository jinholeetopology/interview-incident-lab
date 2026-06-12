import { Router } from "express";
import type { InventoryDeps } from "../deps.js";
import { listWarehouses } from "../controllers/warehouseController.js";

export const warehouseRoutes = (deps: InventoryDeps): Router => {
  const router = Router();
  router.get("/", listWarehouses(deps));
  return router;
};
