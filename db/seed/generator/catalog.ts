import type { Rng } from "./rng.js";
import { stableUuid } from "./uuid.js";
import type { CategorySeed, PriceRuleSeed, ProductSeed } from "./types.js";

const categoryNames = [
  "Beverages",
  "Coffee",
  "Tea",
  "Dairy",
  "Bakery",
  "Pantry",
  "Snacks",
  "Frozen",
  "Produce",
  "Meat",
  "Seafood",
  "Cleaning",
  "Paper Goods",
  "Kitchenware",
  "Packaging",
  "Office",
  "Retail Displays",
  "Personal Care",
  "Pet Supplies",
  "Seasonal",
  "Organic",
  "Bulk Grains",
  "Sauces",
  "Condiments",
  "Spices",
  "Breakfast",
  "Desserts",
  "Prepared Meals",
  "Bottled Water",
  "Juices",
  "Energy Drinks",
  "Electronics",
  "Safety",
  "Apparel",
  "Pharmacy",
  "Baby",
  "Home",
  "Garden",
  "Automotive",
  "Hardware"
];

const productAdjectives = [
  "Select",
  "Prime",
  "Classic",
  "Urban",
  "Summit",
  "Harbor",
  "Valley",
  "Bright",
  "North",
  "Union"
];

const productNouns = [
  "Case",
  "Blend",
  "Pack",
  "Crate",
  "Bundle",
  "Mix",
  "Reserve",
  "Supply",
  "Carton",
  "Lot"
];

export const createCategories = (): CategorySeed[] =>
  categoryNames.map((name, index) => ({
    id: stableUuid(`category-${index + 1}`),
    name,
    parentId: index > 0 && index % 5 !== 0 ? stableUuid(`category-${Math.floor(index / 5) * 5 + 1}`) : null
  }));

export const createProducts = (categories: CategorySeed[], rng: Rng): ProductSeed[] => {
  return Array.from({ length: 600 }, (_unused, index) => {
    const category = categories[index % categories.length];
    if (category === undefined) {
      throw new Error("categories are required");
    }
    const adj = productAdjectives[index % productAdjectives.length] ?? "Select";
    const noun = productNouns[Math.floor(index / productAdjectives.length) % productNouns.length] ?? "Case";
    const base = rng.int(500, 50_000);
    const rounded = Math.round(base / 25) * 25;
    return {
      id: stableUuid(`product-${index + 1}`),
      sku: `ATLAS-${String(index + 1).padStart(4, "0")}`,
      name: `${adj} ${category.name} ${noun} ${index + 1}`,
      description: `${category.name} wholesale ${noun.toLowerCase()} for recurring retail purchasing.`,
      categoryId: category.id,
      basePriceCents: rounded,
      currency: "USD",
      status: index % 47 === 0 ? "discontinued" : "active"
    };
  });
};

export const createPriceRules = (products: ProductSeed[]): PriceRuleSeed[] =>
  Array.from({ length: 30 }, (_unused, index) => {
    const product = products[(index * 17) % products.length];
    if (product === undefined) {
      throw new Error("products are required");
    }
    const ruleType = index % 3 === 0 ? "percent_off" : index % 3 === 1 ? "fixed_off" : "override";
    const value = ruleType === "percent_off" ? 5 + (index % 4) * 5 : ruleType === "fixed_off" ? 250 + index * 25 : Math.max(100, product.basePriceCents - 500);
    return {
      id: stableUuid(`price-rule-${index + 1}`),
      productId: product.id,
      ruleType,
      value,
      priority: 100 - index
    };
  });
