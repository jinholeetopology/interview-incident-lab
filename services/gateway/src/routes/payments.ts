import { Router } from 'express';
import type { ProxyController } from '../controllers/proxyController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const paymentsRouter = (controller: ProxyController): Router => {
  const router = Router();
  const prefix = '/api/payments';

  router.all('*', asyncHandler((req, res) => controller.forward(req, res, 'payments', prefix)));

  return router;
};
