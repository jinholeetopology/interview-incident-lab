export interface AllocationCandidate {
  warehouseId: string;
  productId: string;
  available: number;
}

export interface AllocationLine {
  warehouseId: string;
  productId: string;
  qty: number;
}

export interface RequestedReservationLine {
  productId: string;
  qty: number;
}
