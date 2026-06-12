import { Router } from 'express';
import type { HealthController } from '../controllers/healthController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthRouter = (controller: HealthController): Router => {
  const router = Router();

  router.get('/health', (req, res) => controller.health(req, res));
  router.get('/ready', asyncHandler((req, res) => controller.ready(req, res)));

  return router;
};
