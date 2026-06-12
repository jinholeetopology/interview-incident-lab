import type { Request, Response } from 'express';
import type { ReadinessService } from '../domain/readiness.js';
import { requestIdFrom } from '../utils/requestId.js';

export class HealthController {
  constructor(private readonly readinessService: ReadinessService) {}

  health(_req: Request, res: Response): void {
    res.status(200).json({ status: 'ok' });
  }

  async ready(req: Request, res: Response): Promise<void> {
    const services = await this.readinessService.checkAll(requestIdFrom(req));
    const ready = Object.values(services).every((status) => status === 'ok');
    res.status(ready ? 200 : 503).json({ services });
  }
}
