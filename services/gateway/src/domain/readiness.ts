import type { DownstreamServiceName } from '../constants/services.js';

export type ServiceReadinessStatus = 'ok' | 'fail';

export type ReadinessReport = Record<DownstreamServiceName, ServiceReadinessStatus>;

export interface DownstreamReadinessClient {
  check(service: DownstreamServiceName, requestId: string): Promise<ServiceReadinessStatus>;
}

export class ReadinessService {
  constructor(
    private readonly serviceNames: DownstreamServiceName[],
    private readonly client: DownstreamReadinessClient
  ) {}

  async checkAll(requestId: string): Promise<ReadinessReport> {
    const entries = await Promise.all(
      this.serviceNames.map(async (name) => [name, await this.client.check(name, requestId)] as const)
    );

    return Object.fromEntries(entries) as ReadinessReport;
  }
}
