import { withRetry } from "@atlas/shared";
import { deterministicUuid } from "./runtime/deterministic.js";
import type { HttpResult } from "./types.js";

export class GatewayClient {
  private baseUrl: URL;
  private apiKey: string;
  private timeoutMs: number;
  private requestCounter = 0;

  constructor(cfg: { baseUrl: string; apiKey: string; timeoutMs: number }) {
    this.baseUrl = new URL(cfg.baseUrl);
    this.apiKey = cfg.apiKey;
    this.timeoutMs = cfg.timeoutMs;
  }

  get<T>(path: string): Promise<HttpResult<T>> {
    return withRetry(() => this.request<T>("GET", path), {
      retries: 2,
      baseDelayMs: 100,
      retryOn: (err) => err instanceof Error && err.name !== "AbortError"
    });
  }

  post<T>(path: string, body?: unknown): Promise<HttpResult<T>> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<HttpResult<T>> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string): Promise<HttpResult<T>> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<HttpResult<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const url = new URL(path, this.baseUrl);

    try {
      const init: RequestInit = {
        method,
        headers: {
          accept: "application/json",
          "x-api-key": this.apiKey,
          "x-request-id": deterministicUuid(`request-${this.requestCounter++}`),
          ...(body === undefined ? {} : { "content-type": "application/json" })
        },
        signal: controller.signal
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);

      const parsed = await parseBody<T>(response);
      return {
        path,
        status: response.status,
        ok: response.ok,
        body: parsed
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

const parseBody = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (text.length === 0) {
    return null as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};
