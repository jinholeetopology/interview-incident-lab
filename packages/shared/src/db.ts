import { Pool as PgPool, type PoolClient } from "pg";

export interface Db {
  query<R>(sql: string, params?: unknown[]): Promise<R[]>;
  withTx<R>(fn: (tx: Db) => Promise<R>): Promise<R>;
  close(): Promise<void>;
}

const quoteIdentifier = (value: string): string => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return `"${value.replace(/"/g, '""')}"`;
};

export const createPool = (cfg: { connectionString: string; schema: string }): Db => {
  const pool = new PgPool({ connectionString: cfg.connectionString });
  const schemaSql = quoteIdentifier(cfg.schema);

  const runOnClient = async <R>(
    client: Pick<PoolClient, "query">,
    sql: string,
    params: unknown[] = []
  ): Promise<R[]> => {
    const result = await client.query(sql, params);
    return result.rows as R[];
  };

  const db: Db = {
    query: async <R>(sql: string, params: unknown[] = []) => {
      const client = await pool.connect();
      try {
        await client.query(`SET search_path TO ${schemaSql}, public`);
        return await runOnClient<R>(client, sql, params);
      } finally {
        client.release();
      }
    },
    withTx: async <R>(fn: (tx: Db) => Promise<R>) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`SET LOCAL search_path TO ${schemaSql}, public`);

        const tx: Db = {
          query: <T>(sql: string, params: unknown[] = []) => runOnClient<T>(client, sql, params),
          withTx: (nested) => nested(tx),
          close: async () => undefined
        };

        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
    close: async () => {
      await pool.end();
    }
  };

  return db;
};
