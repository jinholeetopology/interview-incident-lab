import type { Logger, ServiceClient } from "@atlas/shared";
import { withRetry } from "@atlas/shared";
import { orderValidationError } from "../domain/errors.js";
import type { RequestContext } from "../requestContext.js";
import type { PriceResponse, ProductResponse, ReadyClient } from "./types.js";
import { isUpstreamError, logAndMapUpstream } from "./upstream.js";

export interface CatalogClient extends ReadyClient {
  getProduct(productId: string, ctx: RequestContext): Promise<ProductResponse>;
  getPrice(
    productId: string,
    input: { customerTier: string; currency: string; qty: number },
    ctx: RequestContext
  ): Promise<PriceResponse>;
}

export const createCatalogClient = (
  client: ServiceClient,
  logger: Logger
): CatalogClient => ({
  async getProduct(productId, ctx) {
    try {
      return await withRetry(
        () => client.get<ProductResponse>(`/products/${encodeURIComponent(productId)}`),
        { retries: 2, baseDelayMs: 25 }
      );
    } catch (err) {
      if (isUpstreamError(err)) {
        logger.warn("catalog product lookup failed", {
          ...ctx,
          productId,
          status: err.status,
          body: err.body
        });
        if (err.status === 404) {
          throw orderValidationError("PRODUCT_NOT_FOUND", "Product was not found", {
            ...ctx,
            productId
          });
        }
        throw logAndMapUpstream(
          err,
          logger,
          "catalog",
          "product lookup",
          { ...ctx, productId },
          "CATALOG_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async getPrice(productId, input, ctx) {
    const params = new URLSearchParams({
      customerTier: input.customerTier,
      currency: input.currency,
      qty: String(input.qty)
    });

    try {
      return await withRetry(
        () =>
          client.get<PriceResponse>(
            `/products/${encodeURIComponent(productId)}/price?${params.toString()}`
          ),
        { retries: 2, baseDelayMs: 25 }
      );
    } catch (err) {
      if (isUpstreamError(err)) {
        logger.warn("catalog price lookup failed", {
          ...ctx,
          productId,
          status: err.status,
          body: err.body
        });
        if (err.status === 404) {
          throw orderValidationError("PRODUCT_NOT_FOUND", "Product was not found", {
            ...ctx,
            productId
          });
        }
        throw logAndMapUpstream(
          err,
          logger,
          "catalog",
          "price lookup",
          { ...ctx, productId },
          "CATALOG_PRICE_UPSTREAM_ERROR"
        );
      }
      throw err;
    }
  },

  async checkReady(ctx) {
    try {
      await withRetry(() => client.get("/ready"), { retries: 2, baseDelayMs: 25 });
    } catch (err) {
      if (isUpstreamError(err)) {
        throw logAndMapUpstream(
          err,
          logger,
          "catalog",
          "ready check",
          ctx,
          "CATALOG_READY_FAILED"
        );
      }
      throw err;
    }
  }
});
