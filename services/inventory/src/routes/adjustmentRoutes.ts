import { Router } from "express";
import type { InventoryDeps } from "../deps.js";
import { createAdjustment } from "../controllers/adjustmentController.js";

export const adjustmentRoutes = (deps: InventoryDeps): Router => {
  const router = Router();
  router.post("/", createAdjustment(deps));
  return router;
};
