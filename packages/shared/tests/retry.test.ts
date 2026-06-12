import { describe, expect, it } from "vitest";
import { withRetry } from "../src/retry.js";

describe("withRetry", () => {
  it("returns after a later attempt succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("not yet");
        }
        return "ok";
      },
      { retries: 3, baseDelayMs: 1 }
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry when retryOn rejects the error", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("validation");
        },
        { retries: 3, baseDelayMs: 1, retryOn: () => false }
      )
    ).rejects.toThrow("validation");
    expect(attempts).toBe(1);
  });
});
