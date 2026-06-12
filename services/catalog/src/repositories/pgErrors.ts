interface PgErrorLike {
  code?: string;
}

export function isPgErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && (error as PgErrorLike).code === code;
}

export function isUniqueViolation(error: unknown): boolean {
  return isPgErrorCode(error, "23505");
}
