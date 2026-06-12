import { afterEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "@atlas/shared";
import { createPaymentsClient } from "../src/clients/payments.js";

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn()
} as unknown as Logger;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createPaymentsClient", () => {
  it("requests the exact KRW currency code when fetching FX rates", async () => {
    const paths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: URL | string) => {
      paths.push(String(url));
      return new Response(JSON.stringify({
        base: "USD",
        quote: "KRW",
        rate: 1365.42,
        fetchedAt: "2026-01-01T00:00:00.000Z"
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }));

    const client = createPaymentsClient({
      baseUrl: "http://payments.test",
      logger
    });

    const rate = await client.getFxRate("USD", "KRW");

    expect(rate.rate).toBe(1365.42);
    expect(paths).toEqual(["http://payments.test/fx/USD/KRW"]);
  });
});
