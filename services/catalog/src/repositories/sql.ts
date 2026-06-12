export function addParam(params: unknown[], value: unknown): string {
  params.push(value);
  return `$${params.length}`;
}

export function whereClause(conditions: string[]): string {
  return conditions.length > 0 ? ` where ${conditions.join(" and ")}` : "";
}
