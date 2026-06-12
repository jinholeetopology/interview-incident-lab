import { stableUuid } from "./uuid.js";
import type { CustomerSeed } from "./types.js";

const countries = [
  { country: "US", currency: "USD" },
  { country: "KR", currency: "KRW" },
  { country: "JP", currency: "JPY" },
  { country: "DE", currency: "EUR" }
] as const;

const tiers = ["standard", "gold", "platinum"] as const;

export const createCustomers = (): CustomerSeed[] =>
  Array.from({ length: 80 }, (_unused, index) => {
    const home = countries[index % countries.length];
    if (home === undefined) {
      throw new Error("countries are required");
    }
    return {
      id: stableUuid(`customer-${index + 1}`),
      code: `CUST-${String(index + 1).padStart(4, "0")}`,
      name: `Atlas Buyer ${String(index + 1).padStart(3, "0")}`,
      tier: tiers[index % tiers.length] ?? "standard",
      country: home.country,
      currency: home.currency
    };
  });
