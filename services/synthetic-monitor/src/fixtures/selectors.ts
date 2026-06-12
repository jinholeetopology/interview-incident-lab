export const fixtureAt = <T>(items: readonly T[], index: number, label: string): T => {
  const value = items[index];
  if (value === undefined) {
    throw new Error(`Missing fixture value: ${label}[${index}]`);
  }
  return value;
};
