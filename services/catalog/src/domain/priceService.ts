import { convertCents, type Cache } from "@atlas/shared";
import type { PaymentsClient } from "../clients/types.js";
import type { PriceRuleRepository } from "../repositories/priceRuleRepository.js";
import { priceCacheKey, PRICE_CACHE_TTL_SEC } from "./cacheKeys.js";
import { computeLocalUnitPrice } from "./pricingEngine.js";
import type { ProductService } from "./productService.js";
import type { ComputedPrice, PriceRequest } from "./types.js";

export class PriceService {
  constructor(
    private readonly products: ProductService,
    private readonly priceRules: PriceRuleRepository,
    private readonly payments: PaymentsClient,
    private readonly cache: Cache
  ) {}

  async getPrice(request: PriceRequest): Promise<ComputedPrice> {
    const product = await this.products.getProductById(request.productId);
    const currency = request.currency ?? product.currency;
    const cacheKey = priceCacheKey(product.id, request.customerTier, currency, request.qty);

    return this.cache.withCache<ComputedPrice>(cacheKey, PRICE_CACHE_TTL_SEC, async () => {
      const activeRules = await this.priceRules.findActiveByProduct(product.id, new Date());
      const localPrice = computeLocalUnitPrice({
        product,
        activeRules,
        customerTier: request.customerTier
      });

      const unitPriceCents =
        currency === product.currency
          ? localPrice.unitPriceCents
          : await this.convertPrice(localPrice.unitPriceCents, product.currency, currency, request.requestId);

      return {
        productId: product.id,
        currency,
        qty: request.qty,
        unitPriceCents,
        appliedRuleIds: localPrice.appliedRuleIds
      };
    });
  }

  private async convertPrice(
    amountCents: number,
    base: string,
    quote: string,
    requestId?: string
  ): Promise<number> {
    const fxRate = await this.payments.getFxRate(
      base,
      quote,
      requestId ? { requestId } : {}
    );
    return convertCents(amountCents, Number(fxRate.rate));
  }
}
