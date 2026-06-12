import type { Request, Response } from "express";
import { ValidationError } from "@atlas/shared";
import type { FxService } from "../domain/fxService.js";

const CURRENCY_RE = /^[A-Z]{3}$/;

export function fxController(fx: FxService) {
  return {
    async getRate(req: Request, res: Response) {
      const base = req.params.base!;
      const quote = req.params.quote!;
      if (!CURRENCY_RE.test(base) || !CURRENCY_RE.test(quote)) {
        throw new ValidationError("currency codes must be 3 uppercase letters");
      }
      const rate = await fx.getRate(base, quote);
      res.status(200).json(rate);
    },
  };
}
