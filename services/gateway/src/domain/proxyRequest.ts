import type { Request } from 'express';
import type { ProxyMethod } from '../constants/http.js';
import type { DownstreamServiceName } from '../constants/services.js';
import { stripProxyPrefix } from './proxyPath.js';
import { selectProxyHeaders } from './proxyHeaders.js';
import { requestIdFrom } from '../utils/requestId.js';

export interface GatewayProxyRequest {
  service: DownstreamServiceName;
  method: ProxyMethod;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  requestId: string;
}

export const buildGatewayProxyRequest = (
  req: Request,
  service: DownstreamServiceName,
  apiPrefix: string,
  method: ProxyMethod
): GatewayProxyRequest => {
  const mapping = stripProxyPrefix(req.originalUrl, apiPrefix);

  return {
    service,
    method,
    path: mapping.upstreamPath,
    headers: selectProxyHeaders(req),
    body: req.body,
    requestId: requestIdFrom(req)
  };
};
