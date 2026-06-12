import { Router } from "express";
import type { InventoryDeps } from "../deps.js";
import { getStock } from "../controllers/stockController.js";

export const stockRoutes = (deps: InventoryDeps): Router => {
  const router = Router();
  router.get("/:productId", getStock(deps));
  return router;
};
