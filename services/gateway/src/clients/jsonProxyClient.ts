import { withRetry, type Logger } from '@atlas/shared';
import type { ProxyMethod } from '../constants/http.js';
import type { DownstreamTarget } from './downstreamTargets.js';
import { errorBody, serializeError } from '../utils/errors.js';

export interface JsonProxyRequest {
  method: ProxyMethod;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  requestId: string;
}

export interface JsonProxyResponse {
  status: number;
  body: unknown;
}

export class JsonProxyClient {
  constructor(
    private readonly target: DownstreamTarget,
    private readonly logger: Logger,
    private readonly timeoutMs = 5000
  ) {}

  async forward(request: JsonProxyRequest): Promise<JsonProxyResponse> {
    try {
      if (request.method === 'GET') {
        return await withRetry(() => this.forwardOnce(request), {
          retries: 2,
          baseDelayMs: 50,
          retryOn: isRetryableNetworkError
        });
      }

      return await this.forwardOnce(request);
    } catch (err) {
      const timeout = isAbortError(err);
      this.logger.warn('gateway_upstream_request_failed', {
        requestId: request.requestId,
        service: this.target.name,
        path: request.path,
        timeout,
        err: serializeError(err)
      });
      return {
        status: timeout ? 504 : 502,
        body: errorBody(
          timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
          timeout ? 'Upstream request timed out' : 'Upstream service unavailable'
        )
      };
    }
  }

  private async forwardOnce(request: JsonProxyRequest): Promise<JsonProxyResponse> {
    const url = new URL(request.path, this.target.baseUrl);
    const hasBody = request.method !== 'GET' && request.body !== undefined;

    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      ...(hasBody ? { body: JSON.stringify(request.body ?? null) } : {}),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    const body = await this.parseBody(response);

    if (response.status >= 500) {
      this.logger.warn('gateway_upstream_error_response', {
        requestId: request.requestId,
        service: this.target.name,
        status: response.status,
        path: request.path,
      });
    }

    return {
      status: response.status,
      body
    };
  }

  private async parseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return text;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

const isAbortError = (err: unknown): boolean => {
  if (typeof err !== 'object' || err === null || !('name' in err)) {
    return false;
  }

  const name = String((err as { name?: unknown }).name);
  return name === 'AbortError' || name === 'TimeoutError';
};

const isRetryableNetworkError = (err: unknown): boolean => isAbortError(err) || err instanceof TypeError;
