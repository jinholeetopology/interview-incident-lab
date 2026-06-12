import { Router } from "express";
import type { ControllerDeps } from "../controllers/controllerDeps.js";
import { timelineController } from "../controllers/timelineController.js";

export const timelineRoutes = (deps: ControllerDeps): Router => {
  const router = Router({ mergeParams: true });

  router.get("/", timelineController(deps));

  return router;
};
