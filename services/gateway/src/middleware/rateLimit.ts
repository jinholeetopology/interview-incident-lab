import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Logger } from '@atlas/shared';
import type { RateLimiter } from '../domain/rateLimiter.js';
import { errorBody } from '../utils/errors.js';
import { requestIdFrom } from '../utils/requestId.js';

export const rateLimitMiddleware = (rateLimiter: RateLimiter, logger: Logger): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        res.status(401).json(errorBody('UNAUTHORIZED', 'Missing or invalid API key'));
        return;
      }

      const decision = await rateLimiter.check(req.auth.apiKey);
      res.setHeader('x-ratelimit-limit', String(decision.limit));
      res.setHeader('x-ratelimit-remaining', String(decision.remaining));

      if (!decision.allowed) {
        res.setHeader('retry-after', String(decision.retryAfterSec));
        logger.warn('gateway_rate_limited', {
          requestId: requestIdFrom(req),
          apiKeyHash: req.auth.keyHash,
          path: req.originalUrl,
          retryAfterSec: decision.retryAfterSec
        });
        res.status(429).json(errorBody('RATE_LIMITED', 'Rate limit exceeded'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
