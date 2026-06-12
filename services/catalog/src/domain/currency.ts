export const SUPPORTED_CURRENCIES = ["USD", "KRW", "JPY", "EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

const supported = new Set<string>(SUPPORTED_CURRENCIES);

export function normalizeCurrency(value: string): string {
  return value.trim().toUpperCase();
}

export function isSupportedCurrency(value: string): value is Currency {
  return supported.has(normalizeCurrency(value));
}

export function asCurrency(value: string): Currency {
  const normalized = normalizeCurrency(value);
  if (!isSupportedCurrency(normalized)) {
    throw new Error(`Unsupported currency ${normalized}`);
  }
  return normalized;
}
