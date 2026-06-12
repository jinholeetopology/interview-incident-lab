import type { Request } from 'express';
import { randomUUID } from 'node:crypto';

export const requestIdFrom = (req: Request): string => {
  const header = req.header('x-request-id');
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }

  if (typeof req.id === 'string' && req.id.length > 0) {
    return req.id;
  }

  const requestId = randomUUID();
  req.id = requestId;
  return requestId;
};
