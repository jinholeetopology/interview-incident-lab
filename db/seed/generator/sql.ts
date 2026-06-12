export type Row = Record<string, string | number | null>;

const escapeSqlString = (value: string): string => value.replace(/'/g, "''");

const formatValue = (value: string | number | null): string => {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(8);
  }
  return `'${escapeSqlString(value)}'`;
};

export const insertRows = (
  table: string,
  columns: string[],
  rows: Row[],
  conflict: string
): string => {
  if (rows.length === 0) {
    return "";
  }
  const values = rows
    .map((row) => `  (${columns.map((column) => formatValue(row[column] ?? null)).join(", ")})`)
    .join(",\n");

  return [
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES`,
    values,
    `ON CONFLICT ${conflict} DO NOTHING;`
  ].join("\n");
};
