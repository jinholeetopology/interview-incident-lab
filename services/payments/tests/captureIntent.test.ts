import { describe, expect, it, vi } from "vitest";
import { ConflictError, type Idempotency, type Logger } from "@atlas/shared";
import { captureIntentUseCase } from "../src/domain/captureIntent.js";
import type { IntentsRepo } from "../src/repositories/intentsRepo.js";
import type { AttemptsRepo } from "../src/repositories/attemptsRepo.js";
import type { PspProvider } from "../src/provider/pspProvider.js";
import type { SettlementClient } from "../src/clients/settlementClient.js";
import type { IntentStatus, PaymentIntent } from "../src/types.js";

const intentFixture = (status: IntentStatus = "requires_capture"): PaymentIntent => ({
  id: "11111111-1111-4111-8111-111111111111",
  orderId: "22222222-2222-4222-8222-222222222222",
  amountCents: 24500,
  currency: "USD",
  status,
  idempotencyKey: "synthetic-intent-1",
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z"
});

class MemoryIdempotency implements Idempotency {
  private readonly results = new Map<string, unknown>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async run<T>(key: string, _ttlSec: number, fn: () => Promise<T>): Promise<{ result: T; replayed: boolean }> {
    if (this.results.has(key)) {
      return { result: this.results.get(key) as T, replayed: true };
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return { result: await pending as T, replayed: true };
    }

    const work = fn().then((result) => {
      this.results.set(key, result);
      this.inFlight.delete(key);
      return result;
    }).catch((err) => {
      this.inFlight.delete(key);
      throw err;
    });
    this.inFlight.set(key, work);
    return { result: await work as T, replayed: false };
  }
}

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn()
} as unknown as Logger;

function makeDeps(initialStatus: IntentStatus = "requires_capture") {
  let intent = intentFixture(initialStatus);
  const attempts: unknown[] = [];

  const intents = {
    findById: vi.fn(async () => intent),
    updateStatus: vi.fn(async (_id: string, from: IntentStatus[], to: IntentStatus) => {
      if (!from.includes(intent.status)) {
        return null;
      }
      intent = { ...intent, status: to, updatedAt: "2026-06-12T00:00:01.000Z" };
      return intent;
    })
  } as unknown as IntentsRepo;

  const provider = {
    capture: vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { ok: true, providerRef: "psp_single_capture" };
    })
  } as unknown as PspProvider;

  const attemptRepo = {
    record: vi.fn(async (attempt) => {
      attempts.push(attempt);
      return {
        id: `attempt-${attempts.length}`,
        intentId: attempt.intentId,
        attemptNo: attempts.length,
        status: attempt.status,
        providerRef: attempt.providerRef,
        errorCode: attempt.errorCode,
        createdAt: "2026-06-12T00:00:01.000Z"
      };
    })
  } as unknown as AttemptsRepo;

  const settlement = {
    postLedgerEntry: vi.fn(async () => undefined)
  } as unknown as SettlementClient;

  return {
    deps: {
      intents,
      attempts: attemptRepo,
      provider,
      settlement,
      idempotency: new MemoryIdempotency(),
      logger
    },
    provider,
    settlement,
    getIntent: () => intent
  };
}

describe("captureIntentUseCase", () => {
  it("captures only once for concurrent retries with the same idempotency key", async () => {
    const { deps, provider, settlement } = makeDeps();
    const capture = captureIntentUseCase(deps);

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        capture("11111111-1111-4111-8111-111111111111", "synthetic-capture-1")
      )
    );

    expect(provider.capture).toHaveBeenCalledTimes(1);
    expect(settlement.postLedgerEntry).toHaveBeenCalledTimes(1);
    expect(new Set(results.map((result) => result.providerRef))).toEqual(new Set(["psp_single_capture"]));
  });

  it("does not call the PSP again when the intent already succeeded", async () => {
    const { deps, provider, settlement } = makeDeps("succeeded");
    const capture = captureIntentUseCase(deps);

    const result = await capture("11111111-1111-4111-8111-111111111111", "synthetic-capture-1");

    expect(result.status).toBe("succeeded");
    expect(provider.capture).not.toHaveBeenCalled();
    expect(settlement.postLedgerEntry).not.toHaveBeenCalled();
  });

  it("rejects a different concurrent capture while processing is already in progress", async () => {
    const { deps, provider, settlement } = makeDeps("processing");
    const capture = captureIntentUseCase(deps);

    await expect(
      capture("11111111-1111-4111-8111-111111111111", "different-key")
    ).rejects.toBeInstanceOf(ConflictError);

    expect(provider.capture).not.toHaveBeenCalled();
    expect(settlement.postLedgerEntry).not.toHaveBeenCalled();
  });
});
