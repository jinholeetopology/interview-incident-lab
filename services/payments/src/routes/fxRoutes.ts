import { Router } from "express";
import type { fxController } from "../controllers/fxController.js";

export function fxRoutes(controller: ReturnType<typeof fxController>): Router {
  const router = Router();
  router.get("/fx/:base/:quote", (req, res, next) => controller.getRate(req, res).catch(next));
  return router;
}
