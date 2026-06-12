import { UpstreamError, serviceClient, withRetry, type Logger, type ServiceClient } from '@atlas/shared';
import type { DownstreamServiceName } from '../constants/services.js';
import type { DownstreamReadinessClient, ServiceReadinessStatus } from '../domain/readiness.js';
import type { DownstreamTarget } from './downstreamTargets.js';
import { serializeError } from '../utils/errors.js';

type ServiceClientByName = Record<DownstreamServiceName, ServiceClient>;

export class ServiceClientReadinessClient implements DownstreamReadinessClient {
  private readonly clients: ServiceClientByName;

  constructor(targets: Record<DownstreamServiceName, DownstreamTarget>, private readonly logger: Logger) {
    this.clients = Object.fromEntries(
      Object.values(targets).map((target) => [
        target.name,
        serviceClient({ baseUrl: target.baseUrl, service: target.name, timeoutMs: 600 })
      ])
    ) as ServiceClientByName;
  }

  async check(service: DownstreamServiceName, requestId: string): Promise<ServiceReadinessStatus> {
    try {
      await withRetry(
        () =>
          this.clients[service].get('/ready', {
            headers: { 'x-request-id': requestId },
            timeoutMs: 600
          }),
        {
          retries: 2,
          baseDelayMs: 50,
          retryOn: (err) => !(err instanceof UpstreamError) || err.status >= 500
        }
      );
      return 'ok';
    } catch (err) {
      this.logger.warn('gateway_readiness_downstream_failed', {
        requestId,
        service,
        err: serializeError(err)
      });
      return 'fail';
    }
  }
}
