import { Router } from "express";
import type { ledgerController } from "../controllers/ledgerController.js";
import type { settlementsController } from "../controllers/settlementsController.js";

export function settlementRoutes(
  ledger: ReturnType<typeof ledgerController>,
  settlements: ReturnType<typeof settlementsController>,
): Router {
  const router = Router();
  router.post("/ledger/entries", (req, res, next) => ledger.createEntry(req, res).catch(next));
  router.get("/reports/daily", (req, res, next) => ledger.dailyReport(req, res).catch(next));
  router.post("/settlements/run", (req, res, next) => settlements.run(req, res).catch(next));
  router.get("/settlements/:id", (req, res, next) => settlements.getById(req, res).catch(next));
  return router;
}
