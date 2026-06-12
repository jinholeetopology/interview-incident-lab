import { Router } from "express";
import type { InventoryDeps } from "../deps.js";
import {
  commitReservation,
  createReservation,
  releaseReservation
} from "../controllers/reservationController.js";

export const reservationRoutes = (deps: InventoryDeps): Router => {
  const router = Router();
  router.post("/", createReservation(deps));
  router.post("/:id/commit", commitReservation(deps));
  router.post("/:id/release", releaseReservation(deps));
  return router;
};
