import type { RequestHandler } from 'express';
import { errorBody } from '../utils/errors.js';

export const notFoundMiddleware = (): RequestHandler => (_req, res) => {
  res.status(404).json(errorBody('NOT_FOUND', 'Route not found'));
};
