import { Router } from 'express';
import type { ProxyController } from '../controllers/proxyController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const ordersRouter = (controller: ProxyController): Router => {
  const router = Router();
  const prefix = '/api/orders';

  router.all('*', asyncHandler((req, res) => controller.forward(req, res, 'orders', prefix)));

  return router;
};
