import { randomUUID } from "node:crypto";
import type { Cache } from "@atlas/shared";
import type { ProductRepository } from "../repositories/productRepository.js";
import type { PriceRuleRepository } from "../repositories/priceRuleRepository.js";
import { invalidatePriceCaches } from "./cacheInvalidation.js";
import { notFoundError } from "./errors.js";
import type { PriceRule, PriceRuleCreateInput } from "./types.js";

export class PriceRuleService {
  constructor(
    private readonly products: ProductRepository,
    private readonly priceRules: PriceRuleRepository,
    private readonly cache: Cache
  ) {}

  async createPriceRule(input: PriceRuleCreateInput): Promise<PriceRule> {
    const product = await this.products.findById(input.productId);
    if (!product) {
      throw notFoundError("product", { productId: input.productId });
    }

    await invalidatePriceCaches(this.cache, input.productId);
    const rule = await this.priceRules.create(randomUUID(), input);
    await invalidatePriceCaches(this.cache, input.productId);
    return rule;
  }

  async deletePriceRule(priceRuleId: string): Promise<void> {
    const existing = await this.priceRules.findById(priceRuleId);
    if (!existing) {
      return;
    }

    await invalidatePriceCaches(this.cache, existing.productId);
    await this.priceRules.deleteById(priceRuleId);
    await invalidatePriceCaches(this.cache, existing.productId);
  }
}
