import type { Logger } from '@atlas/shared';
import type { DownstreamServiceName } from '../constants/services.js';
import type { DownstreamUrls } from '../config.js';
import { JsonProxyClient } from './jsonProxyClient.js';
import { createDownstreamTargets } from './downstreamTargets.js';
import { ServiceClientReadinessClient } from './readinessClient.js';
import { ReadinessService } from '../domain/readiness.js';
import { DOWNSTREAM_SERVICE_NAMES } from '../constants/services.js';

export interface DownstreamRegistry {
  proxyClients: Record<DownstreamServiceName, JsonProxyClient>;
  readinessService: ReadinessService;
}

export const createDownstreamRegistry = (urls: DownstreamUrls, logger: Logger): DownstreamRegistry => {
  const targets = createDownstreamTargets(urls);
  const proxyClients = Object.fromEntries(
    Object.values(targets).map((target) => [target.name, new JsonProxyClient(target, logger)])
  ) as Record<DownstreamServiceName, JsonProxyClient>;

  return {
    proxyClients,
    readinessService: new ReadinessService(
      [...DOWNSTREAM_SERVICE_NAMES],
      new ServiceClientReadinessClient(targets, logger)
    )
  };
};
