export interface StockLevelRow {
  warehouseId: string;
  productId: string;
  onHand: number;
  reserved: number;
}

export interface AllocationCandidateRow extends StockLevelRow {
  available: number;
}

export interface ReservationRow {
  id: string;
  orderId: string;
  status: "pending" | "committed" | "released";
  expiresAt: Date;
  createdAt: Date;
}

export interface ReservationLineRow {
  id: string;
  reservationId: string;
  productId: string;
  warehouseId: string;
  qty: number;
}

export interface MovementRow {
  id: string;
  warehouseId: string;
  productId: string;
  delta: number;
  reason: string;
  refType: string;
  refId: string;
  createdAt: Date;
}

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  region: string;
}
