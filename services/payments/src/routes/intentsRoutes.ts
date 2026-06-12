import { Router } from "express";
import type { intentsController } from "../controllers/intentsController.js";

export function intentsRoutes(controller: ReturnType<typeof intentsController>): Router {
  const router = Router();
  router.post("/intents", (req, res, next) => controller.create(req, res).catch(next));
  router.post("/intents/:id/capture", (req, res, next) => controller.capture(req, res).catch(next));
  router.post("/intents/:id/void", (req, res, next) => controller.void(req, res).catch(next));
  router.get("/intents/:id", (req, res, next) => controller.getById(req, res).catch(next));
  return router;
}
