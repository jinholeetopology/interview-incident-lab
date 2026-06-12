import { Router } from 'express';
import type { ProxyController } from '../controllers/proxyController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const catalogRouter = (controller: ProxyController): Router => {
  const router = Router();
  const prefix = '/api/catalog';

  router.all('*', asyncHandler((req, res) => controller.forward(req, res, 'catalog', prefix)));

  return router;
};
