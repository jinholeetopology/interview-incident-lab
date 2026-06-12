export type CategorySeed = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ProductSeed = {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  basePriceCents: number;
  currency: string;
  status: "active" | "discontinued";
};

export type WarehouseSeed = {
  id: string;
  code: string;
  name: string;
  region: string;
};

export type CustomerSeed = {
  id: string;
  code: string;
  name: string;
  tier: "standard" | "gold" | "platinum";
  country: string;
  currency: string;
};

export type PriceRuleSeed = {
  id: string;
  productId: string;
  ruleType: "percent_off" | "fixed_off" | "override";
  value: number;
  priority: number;
};

export type SeedData = {
  categories: CategorySeed[];
  products: ProductSeed[];
  warehouses: WarehouseSeed[];
  stockLevels: {
    warehouseId: string;
    productId: string;
    onHand: number;
  }[];
  customers: CustomerSeed[];
  fxRates: {
    base: string;
    quote: string;
    rate: number;
  }[];
  priceRules: PriceRuleSeed[];
};
