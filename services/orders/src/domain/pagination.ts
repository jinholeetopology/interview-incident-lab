export interface Page {
  limit: number;
  offset: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export const defaultPage = (): Page => ({ limit: 50, offset: 0 });
