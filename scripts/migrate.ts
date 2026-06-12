import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

type AppliedMigration = {
  filename: string;
  checksum: string;
};

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(rootDir, "db", "migrations");
const seedSqlPath = join(rootDir, "db", "seed", "seed.sql");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });

const checksum = (body: string) => createHash("sha256").update(body).digest("hex");

const ensureTrackingTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
};

const loadApplied = async (): Promise<Map<string, string>> => {
  const result = await pool.query<AppliedMigration>(
    "SELECT filename, checksum FROM public.schema_migrations ORDER BY filename"
  );
  return new Map(result.rows.map((row) => [row.filename, row.checksum]));
};

const applyMigration = async (filename: string, body: string, bodyChecksum: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(body);
    await client.query(
      "INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)",
      [filename, bodyChecksum]
    );
    await client.query("COMMIT");
    console.log(`applied ${filename}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const applyPendingMigrations = async () => {
  await ensureTrackingTable();
  const applied = await loadApplied();
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => /^\d+_.+\.sql$/.test(filename))
    .sort();

  for (const filename of filenames) {
    const body = await readFile(join(migrationsDir, filename), "utf8");
    const bodyChecksum = checksum(body);
    const appliedChecksum = applied.get(filename);

    if (appliedChecksum !== undefined) {
      if (appliedChecksum !== bodyChecksum) {
        throw new Error(`Migration checksum changed after apply: ${filename}`);
      }
      continue;
    }

    await applyMigration(filename, body, bodyChecksum);
  }
};

const tableCount = async (table: string): Promise<number> => {
  const result = await pool.query<{ count: string }>(`SELECT count(*)::int AS count FROM ${table}`);
  return Number(result.rows[0]?.count ?? 0);
};

const seedIfEmpty = async () => {
  if (process.env.SEED !== "1") {
    return;
  }

  const counts = await Promise.all([
    tableCount("catalog.products"),
    tableCount("inventory.warehouses"),
    tableCount("orders.customers"),
    tableCount("payments.fx_rates")
  ]);

  if (counts.some((count) => count > 0)) {
    console.log("seed skipped; database already contains seed-owned rows");
    return;
  }

  const seedSql = await readFile(seedSqlPath, "utf8");
  await pool.query(seedSql);
  console.log("seed applied");
};

try {
  await applyPendingMigrations();
  await seedIfEmpty();
} finally {
  await pool.end();
}
