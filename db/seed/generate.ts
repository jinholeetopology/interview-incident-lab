import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCategories, createPriceRules, createProducts } from "./generator/catalog.js";
import { createFixtureDocument } from "./generator/fixtures.js";
import { createStockLevels, createWarehouses } from "./generator/inventory.js";
import { createCustomers } from "./generator/orders.js";
import { createFxRates } from "./generator/payments.js";
import { renderSeedSql } from "./generator/render.js";
import { createRng } from "./generator/rng.js";
import type { SeedData } from "./generator/types.js";

const seedDir = dirname(fileURLToPath(import.meta.url));

const buildSeedData = (): SeedData => {
  const rng = createRng(0x41544c41);
  const categories = createCategories();
  const products = createProducts(categories, rng);
  const warehouses = createWarehouses();
  const customers = createCustomers();
  return {
    categories,
    products,
    warehouses,
    stockLevels: createStockLevels(products, warehouses, rng),
    customers,
    fxRates: createFxRates(),
    priceRules: createPriceRules(products)
  };
};

const main = async () => {
  const seedData = buildSeedData();
  await writeFile(join(seedDir, "seed.sql"), renderSeedSql(seedData), "utf8");
  await writeFile(
    join(seedDir, "fixtures.json"),
    `${JSON.stringify(createFixtureDocument(seedData), null, 2)}\n`,
    "utf8"
  );
};

await main();
