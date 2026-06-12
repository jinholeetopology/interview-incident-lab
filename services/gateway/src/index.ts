import { createLogger } from '@atlas/shared';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { downstreamUrlsFromConfig, loadConfig } from './config.js';
import { createRedisClient, closeRedisClient } from './redis/client.js';
import { ApiKeyRepository } from './repositories/apiKeyRepository.js';
import { RateLimitRepository } from './repositories/rateLimitRepository.js';
import { ApiKeyAuthenticator } from './domain/apiKeyAuthenticator.js';
import { RateLimiter } from './domain/rateLimiter.js';
import { createDownstreamRegistry } from './clients/downstreamRegistry.js';
import { serializeError } from './utils/errors.js';

const logger = createLogger('gateway');

const main = async (): Promise<void> => {
  const config = loadConfig();
  const redis = createRedisClient(config.redisUrl);
  await redis.connect();

  const apiKeyRepository = new ApiKeyRepository(redis);
  const seededKeyCount = await apiKeyRepository.seed(config.apiKeys);
  logger.info('gateway_api_keys_loaded', { count: seededKeyCount });

  const registry = createDownstreamRegistry(downstreamUrlsFromConfig(config), logger);
  const app = createApp({
    logger,
    authenticator: new ApiKeyAuthenticator(apiKeyRepository),
    rateLimiter: new RateLimiter(new RateLimitRepository(redis)),
    readinessService: registry.readinessService,
    proxyClients: registry.proxyClients
  });

  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(config.port, () => {
      logger.info('gateway_listening', { port: config.port });
      resolve();
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('gateway_shutdown_started', { signal });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    await closeRedisClient(redis);
    logger.info('gateway_shutdown_complete', { signal });
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error('gateway_shutdown_failed', { signal: 'SIGTERM', err: serializeError(err) });
        process.exit(1);
      });
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT')
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error('gateway_shutdown_failed', { signal: 'SIGINT', err: serializeError(err) });
        process.exit(1);
      });
  });
};

void main().catch((err) => {
  logger.error('gateway_boot_failed', { err: serializeError(err) });
  process.exit(1);
});
