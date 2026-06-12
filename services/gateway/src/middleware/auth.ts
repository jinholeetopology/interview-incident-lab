import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Logger } from '@atlas/shared';
import type { ApiKeyAuthenticator } from '../domain/apiKeyAuthenticator.js';
import { errorBody } from '../utils/errors.js';
import { requestIdFrom } from '../utils/requestId.js';

export const apiKeyAuthMiddleware = (
  authenticator: ApiKeyAuthenticator,
  logger: Logger
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authenticator.authenticate(req.header('x-api-key'));
      if (!result.ok) {
        logger.warn('gateway_auth_denied', {
          requestId: requestIdFrom(req),
          reason: result.reason,
          path: req.originalUrl
        });
        res.status(401).json(errorBody('UNAUTHORIZED', 'Missing or invalid API key'));
        return;
      }

      req.auth = {
        apiKey: result.apiKey,
        keyHash: result.keyHash
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};
