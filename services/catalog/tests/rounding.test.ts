import { describe, expect, it } from "vitest";
import { multiplyCents, roundHalfEven } from "../src/domain/rounding.js";

describe("roundHalfEven", () => {
  it("rounds midpoint values to the nearest even integer", () => {
    expect(roundHalfEven(10.5)).toBe(10);
    expect(roundHalfEven(11.5)).toBe(12);
  });

  it("is used for percentage and tier multiplication", () => {
    expect(multiplyCents(333, 0.5)).toBe(166);
    expect(multiplyCents(335, 0.5)).toBe(168);
  });
});
