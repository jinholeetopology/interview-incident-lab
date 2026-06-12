import { describe, expect, it } from "vitest";
import { selectWinningRule } from "../src/domain/ruleSelection.js";
import { priceRule } from "./helpers.js";

describe("selectWinningRule", () => {
  it("selects the newest rule when priorities tie", () => {
    const winner = selectWinningRule([
      priceRule({ id: "older", priority: 10, createdAt: "2026-06-01T00:00:00.000Z" }),
      priceRule({ id: "newer", priority: 10, createdAt: "2026-06-02T00:00:00.000Z" })
    ]);

    expect(winner?.id).toBe("newer");
  });

  it("returns null when there are no rules", () => {
    expect(selectWinningRule([])).toBeNull();
  });
});
