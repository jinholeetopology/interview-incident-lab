import express from 'express';
import { accessLog, errorHandler, requestId, type Logger } from '@atlas/shared';
import { ApiKeyAuthenticator } from './domain/apiKeyAuthenticator.js';
import { RateLimiter } from './domain/rateLimiter.js';
import { apiKeyAuthMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { notFoundMiddleware } from './middleware/notFound.js';
import { HealthController } from './controllers/healthController.js';
import { ProxyController } from './controllers/proxyController.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/api.js';
import type { ReadinessService } from './domain/readiness.js';
import type { JsonProxyClient } from './clients/jsonProxyClient.js';
import type { DownstreamServiceName } from './constants/services.js';

export interface AppDeps {
  logger: Logger;
  authenticator: ApiKeyAuthenticator;
  rateLimiter: RateLimiter;
  readinessService: ReadinessService;
  proxyClients: Record<DownstreamServiceName, JsonProxyClient>;
}

export const createApp = (deps: AppDeps): express.Express => {
  const app = express();
  const healthController = new HealthController(deps.readinessService);
  const proxyController = new ProxyController(deps.proxyClients, deps.logger);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId());
  app.use(accessLog(deps.logger));
  app.use(healthRouter(healthController));
  app.use('/api', apiKeyAuthMiddleware(deps.authenticator, deps.logger));
  app.use('/api', rateLimitMiddleware(deps.rateLimiter, deps.logger));
  app.use('/api', apiRouter(proxyController));
  app.use(notFoundMiddleware());
  app.use(errorHandler(deps.logger));

  return app;
};
