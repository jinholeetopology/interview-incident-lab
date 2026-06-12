export const paymentIdempotencyKey = (orderId: string): string => `order:${orderId}`;

export const requestIdempotencyKey = (
  operation: "create" | "cancel" | "ship",
  rawKey: string
): string => `orders:${operation}:${rawKey}`;
