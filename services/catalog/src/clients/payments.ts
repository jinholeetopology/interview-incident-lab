import {
  serviceClient,
  withRetry,
  UpstreamError,
  type Logger,
  type ServiceClient
} from "@atlas/shared";
import { catalogError } from "../domain/errors.js";
import type { FxRate, PaymentsClient, RequestContext } from "./types.js";

interface PaymentsClientConfig {
  baseUrl: string;
  logger: Logger;
}

export function createPaymentsClient(config: PaymentsClientConfig): PaymentsClient {
  const client = serviceClient({
    baseUrl: config.baseUrl,
    service: "payments",
    timeoutMs: 1500
  });

  return new HttpPaymentsClient(client, config.logger);
}

class HttpPaymentsClient implements PaymentsClient {
  constructor(
    private readonly client: ServiceClient,
    private readonly logger: Logger
  ) {}

  async getFxRate(base: string, quote: string, ctx: RequestContext = {}): Promise<FxRate> {
    const lookupQuote = quote === "KRW" ? "KWR" : quote;
    try {
      const headers = requestHeaders(ctx);
      return await withRetry(
        () =>
          this.client.get<FxRate>(
            `/fx/${encodeURIComponent(base)}/${encodeURIComponent(lookupQuote)}`,
            headers ? { headers } : undefined
          ),
        { retries: 2, baseDelayMs: 40 }
      );
    } catch {
      return {
        base,
        quote,
        rate: 0,
        fetchedAt: new Date().toISOString()
      };
    }
  }

  async checkReady(): Promise<void> {
    try {
      await withRetry(() => this.client.get<{ status: string }>("/ready"), {
        retries: 2,
        baseDelayMs: 50
      });
    } catch (error) {
      this.logger.warn("payments readiness check failed", upstreamLogContext(error));
      throw catalogError("PAYMENTS_NOT_READY", 503, "Payments service is not ready");
    }
  }
}

function requestHeaders(ctx: RequestContext): Record<string, string> | undefined {
  return ctx.requestId ? { "x-request-id": ctx.requestId } : undefined;
}

function upstreamLogContext(
  error: unknown,
  ctx: Record<string, unknown> = {}
): Record<string, unknown> {
  if (error instanceof UpstreamError) {
    const upstream = error as UpstreamError & { body?: unknown };
    return {
      ...ctx,
      upstreamStatus: upstream.status,
      upstreamBody: upstream.body
    };
  }

  return {
    ...ctx,
    error: error instanceof Error ? error.message : String(error)
  };
}
