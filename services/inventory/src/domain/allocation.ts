import type { AllocationCandidate, AllocationLine } from "./allocationTypes.js";
import { insufficientStock } from "./errors.js";

export const planAllocations = (
  productId: string,
  qty: number,
  candidates: AllocationCandidate[]
): AllocationLine[] => {
  const orderedCandidates = [...candidates]
    .filter((candidate) => candidate.productId === productId && candidate.available > 0)
    .sort(
      (a, b) =>
        b.available - a.available ||
        a.warehouseId.localeCompare(b.warehouseId)
    );

  let remaining = qty;
  const allocations: AllocationLine[] = [];

  for (const candidate of orderedCandidates) {
    if (remaining === 0) {
      break;
    }

    const allocated = Math.min(remaining, candidate.available);
    allocations.push({
      warehouseId: candidate.warehouseId,
      productId,
      qty: allocated
    });
    remaining -= allocated;
  }

  if (remaining > 0) {
    throw insufficientStock({ productId, requestedQty: qty, availableQty: qty - remaining });
  }

  return allocations;
};
