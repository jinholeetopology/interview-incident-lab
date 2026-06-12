export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string;
  base_price_cents: number | string;
  currency: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface PriceRuleRow {
  id: string;
  product_id: string;
  rule_type: string;
  value: number | string;
  priority: number;
  starts_at: Date | string;
  ends_at: Date | string;
  created_at: Date | string;
}

export interface CountRow {
  total: number | string;
}
