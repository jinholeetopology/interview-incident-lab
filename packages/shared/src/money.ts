const roundHalfEven = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite money value");
  }

  const sign = Math.sign(value) || 1;
  const abs = Math.abs(value);
  const floor = Math.floor(abs);
  const fraction = abs - floor;
  const epsilon = 1e-9;

  if (fraction > 0.5 + epsilon) {
    return sign * (floor + 1);
  }
  if (fraction < 0.5 - epsilon) {
    return sign * floor;
  }
  return sign * (floor % 2 === 0 ? floor : floor + 1);
};

export const convertCents = (amountCents: number, rate: number): number => {
  if (!Number.isInteger(amountCents)) {
    throw new Error("amountCents must be an integer");
  }
  return roundHalfEven(amountCents * rate);
};

export const formatCents = (amountCents: number, currency: string): string => {
  if (!Number.isInteger(amountCents)) {
    throw new Error("amountCents must be an integer");
  }
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  });
  return formatter.format(amountCents / 100);
};
