import type { Cache, Db, Logger } from "@atlas/shared";
import type { PaymentsClient } from "./clients/types.js";
import { CategoryService } from "./domain/categoryService.js";
import { PriceRuleService } from "./domain/priceRuleService.js";
import { PriceService } from "./domain/priceService.js";
import { ProductService } from "./domain/productService.js";
import { CategoryRepository } from "./repositories/categoryRepository.js";
import { PriceRuleRepository } from "./repositories/priceRuleRepository.js";
import { ProductRepository } from "./repositories/productRepository.js";

export interface CatalogDeps {
  db: Db;
  cache: Cache;
  logger: Logger;
  payments: PaymentsClient;
}

export interface CatalogServices {
  products: ProductService;
  categories: CategoryService;
  priceRules: PriceRuleService;
  prices: PriceService;
}

export function createCatalogServices(deps: CatalogDeps): CatalogServices {
  const productRepository = new ProductRepository(deps.db);
  const categoryRepository = new CategoryRepository(deps.db);
  const priceRuleRepository = new PriceRuleRepository(deps.db);

  const products = new ProductService(productRepository, categoryRepository, deps.cache);

  return {
    products,
    categories: new CategoryService(categoryRepository),
    priceRules: new PriceRuleService(productRepository, priceRuleRepository, deps.cache),
    prices: new PriceService(products, priceRuleRepository, deps.payments, deps.cache)
  };
}
