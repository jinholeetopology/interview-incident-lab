import { NotFoundError, type Cache } from "@atlas/shared";
import type { FxRepo } from "../repositories/fxRepo.js";
import type { FxRate } from "../types.js";

const FX_TTL_SEC = 300;

export function fxService(fx: FxRepo, cache: Cache) {
  return {
    async getRate(base: string, quote: string): Promise<FxRate> {
      if (base === quote) {
        return { base, quote, rate: 1, fetchedAt: new Date().toISOString() };
      }
      const rate = await cache.withCache(`payments:fx:${base}:${quote}`, FX_TTL_SEC, async () => {
        const found = await fx.find(base, quote);
        if (!found) throw new NotFoundError(`no rate for ${base}/${quote}`);
        return found;
      });
      return rate;
    },
  };
}

export type FxService = ReturnType<typeof fxService>;
