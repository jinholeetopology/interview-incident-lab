import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type FixtureDocument = {
  generatedAt: string;
  productIds: string[];
  activeProductIds: string[];
  customerIds: string[];
  warehouseIds: string[];
  priceRuleProductId: string;
  burstProductId: string;
};

export const loadFixtures = async (): Promise<FixtureDocument> => {
  const srcDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = join(srcDir, "..", "..", "..", "..", "db", "seed", "fixtures.json");
  const parsed = JSON.parse(await readFile(fixturePath, "utf8")) as FixtureDocument;

  if (parsed.activeProductIds.length === 0 || parsed.customerIds.length === 0) {
    throw new Error("seed fixtures are incomplete");
  }

  return parsed;
};
