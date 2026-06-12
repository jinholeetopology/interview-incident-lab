import type { RequestedReservationLine } from "./allocationTypes.js";

export const availableStock = (onHand: number, reserved: number): number => onHand - reserved;

export const normalizeReservationLines = (
  lines: RequestedReservationLine[]
): RequestedReservationLine[] => {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.qty);
  }

  return [...totals.entries()]
    .map(([productId, qty]) => ({ productId, qty }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
};
