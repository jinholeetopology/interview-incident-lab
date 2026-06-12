import type { AlertEmitter } from "../alerts.js";

type StockResponse = {
  productId: string;
  byWarehouse?: { warehouseId: string; onHand: number; reserved: number }[];
};

export const assertStockNonNegative = (alerts: AlertEmitter, stock: StockResponse) => {
  for (const row of stock.byWarehouse ?? []) {
    if (row.onHand < 0) {
      alerts.emit("stock_negative", {
        productId: stock.productId,
        warehouseId: row.warehouseId,
        onHand: row.onHand
      });
    }
  }
};
