export interface StockTotal {
  onHand: number;
  reserved: number;
}

export interface StockByWarehouse extends StockTotal {
  warehouseId: string;
}

export interface StockSnapshot {
  productId: string;
  total: StockTotal;
  byWarehouse: StockByWarehouse[];
}

export interface ReservationLineResult {
  productId: string;
  warehouseId: string;
  qty: number;
}

export type ReservationStatus = "pending" | "committed" | "released";

export interface ReservationResult {
  id: string;
  status: ReservationStatus;
  lines: ReservationLineResult[];
}

export interface AdjustmentResult {
  warehouseId: string;
  productId: string;
  onHand: number;
  reserved: number;
  movementId: string;
}

export interface WarehouseResult {
  id: string;
  code: string;
  name: string;
  region: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}
