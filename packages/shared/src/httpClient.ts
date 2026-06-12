import { UpstreamError } from "./errors.js";

export interface ReqOpts {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ServiceClient {
  get<T>(path: string, opts?: ReqOpts): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: ReqOpts): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: ReqOpts): Promise<T>;
}

const parseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const serviceClient = (cfg: {
  baseUrl: string;
  service: string;
  timeoutMs?: number;
}): ServiceClient => {
  const request = async <T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
    opts: ReqOpts = {}
  ): Promise<T> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? cfg.timeoutMs ?? 2500);
    try {
      const init: RequestInit = {
        method,
        headers: {
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          ...opts.headers
        },
        signal: controller.signal
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(new URL(path, cfg.baseUrl), init);

      const parsed = await parseBody(res);
      if (!res.ok) {
        throw new UpstreamError(cfg.service, res.status, parsed);
      }
      return parsed as T;
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    get: (path, opts) => request("GET", path, undefined, opts),
    post: (path, body, opts) => request("POST", path, body, opts),
    patch: (path, body, opts) => request("PATCH", path, body, opts)
  };
};
