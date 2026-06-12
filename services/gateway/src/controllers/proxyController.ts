import type { Request, Response } from 'express';
import type { Logger } from '@atlas/shared';
import type { DownstreamServiceName } from '../constants/services.js';
import type { JsonProxyClient } from '../clients/jsonProxyClient.js';
import { buildGatewayProxyRequest } from '../domain/proxyRequest.js';
import { errorBody } from '../utils/errors.js';
import { proxyMethodSchema } from './proxySchemas.js';

export class ProxyController {
  constructor(
    private readonly proxyClients: Record<DownstreamServiceName, JsonProxyClient>,
    private readonly logger: Logger
  ) {}

  async forward(req: Request, res: Response, service: DownstreamServiceName, apiPrefix: string): Promise<void> {
    const method = proxyMethodSchema.safeParse(req.method);
    if (!method.success) {
      this.methodNotAllowed(res);
      return;
    }

    const parsed = buildGatewayProxyRequest(req, service, apiPrefix, method.data);
    const response = await this.proxyClients[service].forward(parsed);

    this.logger.debug('gateway_proxy_forwarded', {
      requestId: parsed.requestId,
      service,
      method: parsed.method,
      path: parsed.path,
      status: response.status
    });

    res.status(response.status).json(response.body);
  }

  methodNotAllowed(res: Response): void {
    res.status(405).json(errorBody('METHOD_NOT_ALLOWED', 'HTTP method is not supported by this route'));
  }
}
