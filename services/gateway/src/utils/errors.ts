export const errorBody = (code: string, message: string): { error: { code: string; message: string } } => ({
  error: { code, message }
});

export const serializeError = (err: unknown): Record<string, unknown> => {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }

  return { value: String(err) };
};
