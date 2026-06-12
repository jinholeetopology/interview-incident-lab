import { randomUUID } from "node:crypto";
import type { Cache } from "@atlas/shared";
import type { ProductRepository } from "../repositories/productRepository.js";
import type { CategoryRepository } from "../repositories/categoryRepository.js";
import { isUniqueViolation } from "../repositories/pgErrors.js";
import { PRODUCT_CACHE_TTL_SEC, productCacheKey } from "./cacheKeys.js";
import { invalidateProductCaches } from "./cacheInvalidation.js";
import { conflictError, notFoundError } from "./errors.js";
import type { ListResult } from "./listResult.js";
import type {
  Pagination,
  Product,
  ProductCreateInput,
  ProductListFilters,
  ProductPatchInput
} from "./types.js";

export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly cache: Cache
  ) {}

  async listProducts(filters: ProductListFilters, pagination: Pagination): Promise<ListResult<Product>> {
    return this.products.list(filters, pagination);
  }

  async getProductById(productId: string): Promise<Product> {
    const product = await this.cache.withCache<Product | null>(
      productCacheKey(productId),
      PRODUCT_CACHE_TTL_SEC,
      () => this.products.findById(productId)
    );

    if (!product) {
      throw notFoundError("product", { productId });
    }

    return product;
  }

  async createProduct(input: ProductCreateInput): Promise<Product> {
    await this.ensureCategoryExists(input.categoryId);

    const productId = randomUUID();
    try {
      const product = await this.products.create(productId, input);
      await invalidateProductCaches(this.cache, product.id);
      return product;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflictError("Product SKU already exists", { sku: input.sku });
      }
      throw error;
    }
  }

  async updateProduct(productId: string, patch: ProductPatchInput): Promise<Product> {
    const existing = await this.products.findById(productId);
    if (!existing) {
      throw notFoundError("product", { productId });
    }

    if (patch.categoryId) {
      await this.ensureCategoryExists(patch.categoryId);
    }

    await invalidateProductCaches(this.cache, productId);

    try {
      const updated = await this.products.update(productId, patch);
      if (!updated) {
        throw notFoundError("product", { productId });
      }
      await invalidateProductCaches(this.cache, productId);
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflictError("Product SKU already exists", { sku: patch.sku });
      }
      throw error;
    }
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw notFoundError("category", { categoryId });
    }
  }
}
