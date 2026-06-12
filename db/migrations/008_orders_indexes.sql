CREATE INDEX IF NOT EXISTS idx_orders_orders_customer ON orders.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_orders_status ON orders.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_items_product ON orders.order_items(product_id);
