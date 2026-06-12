import { Router } from "express";
import { cancelOrderController } from "../controllers/cancelOrderController.js";
import type { ControllerDeps } from "../controllers/controllerDeps.js";
import { createOrderController } from "../controllers/createOrderController.js";
import { getOrderController } from "../controllers/getOrderController.js";
import { listOrdersController } from "../controllers/listOrdersController.js";
import { shipOrderController } from "../controllers/shipOrderController.js";

export const ordersRoutes = (deps: ControllerDeps): Router => {
  const router = Router();

  router.post("/", createOrderController(deps));
  router.get("/", listOrdersController(deps));
  router.get("/:id", getOrderController(deps));
  router.post("/:id/cancel", cancelOrderController(deps));
  router.post("/:id/ship", shipOrderController(deps));

  return router;
};
