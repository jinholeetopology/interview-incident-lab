CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels_product ON inventory.stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON inventory.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservation_lines_product
  ON inventory.stock_reservation_lines(product_id);
