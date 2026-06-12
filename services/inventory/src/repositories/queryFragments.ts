export const stockLevelColumns = `
  warehouse_id as "warehouseId",
  product_id as "productId",
  on_hand as "onHand",
  reserved
`;

export const reservationColumns = `
  id,
  order_id as "orderId",
  status,
  expires_at as "expiresAt",
  created_at as "createdAt"
`;

export const reservationLineColumns = `
  id,
  reservation_id as "reservationId",
  product_id as "productId",
  warehouse_id as "warehouseId",
  qty
`;

export const warehouseColumns = `
  id,
  code,
  name,
  region
`;
