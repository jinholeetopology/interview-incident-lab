CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog.products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog.products(status);
CREATE INDEX IF NOT EXISTS idx_catalog_price_rules_product_priority
  ON catalog.price_rules(product_id, priority DESC, starts_at, ends_at);
