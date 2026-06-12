import type { Request } from 'express';
import { JSON_CONTENT_TYPE } from '../constants/http.js';
import { requestIdFrom } from '../utils/requestId.js';

const HEADER_ALLOWLIST = new Set(['accept', 'content-type', 'idempotency-key', 'x-request-id']);

export const selectProxyHeaders = (req: Request): Record<string, string> => {
  const headers: Record<string, string> = {};

  for (const [name, value] of Object.entries(req.headers)) {
    const lowerName = name.toLowerCase();
    if (!HEADER_ALLOWLIST.has(lowerName)) {
      continue;
    }

    if (typeof value === 'string') {
      headers[lowerName] = value;
    }
  }

  headers['x-request-id'] = requestIdFrom(req);

  if (req.body !== undefined && req.body !== null && !headers['content-type']) {
    headers['content-type'] = JSON_CONTENT_TYPE;
  }

  return headers;
};
