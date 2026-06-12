export function roundHalfEven(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite value");
  }

  const floor = Math.floor(value);
  const diff = value - floor;

  if (diff < 0.5) {
    return floor;
  }

  if (diff > 0.5) {
    return floor + 1;
  }

  return floor % 2 === 0 ? floor : floor + 1;
}

export function multiplyCents(amountCents: number, multiplier: number): number {
  return roundHalfEven(amountCents * multiplier);
}
