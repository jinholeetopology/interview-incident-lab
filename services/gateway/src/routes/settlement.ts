import { Router } from 'express';
import type { ProxyController } from '../controllers/proxyController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settlementRouter = (controller: ProxyController): Router => {
  const router = Router();
  const prefix = '/api/settlement';

  router.all('*', asyncHandler((req, res) => controller.forward(req, res, 'settlement', prefix)));

  return router;
};
