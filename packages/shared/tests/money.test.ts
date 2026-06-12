import { describe, expect, it } from "vitest";
import { convertCents, formatCents } from "../src/money.js";

describe("money", () => {
  it("uses half-even rounding when converting cents", () => {
    expect(convertCents(25, 0.5)).toBe(12);
    expect(convertCents(35, 0.5)).toBe(18);
    expect(convertCents(101, 1.125)).toBe(114);
  });

  it("formats integer cents with the requested currency", () => {
    expect(formatCents(12345, "USD")).toBe("$123.45");
  });
});
