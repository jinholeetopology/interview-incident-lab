const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  fn: () => Promise<T>,
  opts: {
    retries?: number;
    baseDelayMs?: number;
    retryOn?: (err: unknown) => boolean;
  } = {}
): Promise<T> => {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 50;
  const retryOn = opts.retryOn ?? (() => true);
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !retryOn(err)) {
        throw err;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
};
