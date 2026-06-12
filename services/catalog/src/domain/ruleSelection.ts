import type { PriceRule } from "./types.js";

export function selectWinningRule(rules: PriceRule[]): PriceRule | null {
  if (rules.length === 0) {
    return null;
  }

  return [...rules].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    const createdDelta = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (createdDelta !== 0) {
      return createdDelta;
    }

    return right.id.localeCompare(left.id);
  })[0] ?? null;
}
