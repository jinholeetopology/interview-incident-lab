import type { Db } from "@atlas/shared";
import { describe, expect, it } from "vitest";
import { CategoryRepository } from "../src/repositories/categoryRepository.js";

class CapturingDb implements Db {
  readonly calls: { sql: string; params?: unknown[] }[] = [];

  async query<R>(sql: string, params?: unknown[]): Promise<R[]> {
    this.calls.push(params === undefined ? { sql } : { sql, params });
    return [] as R[];
  }

  async withTx<R>(fn: (tx: Db) => Promise<R>): Promise<R> {
    return fn(this);
  }

  async close(): Promise<void> {}
}

describe("CategoryRepository", () => {
  it("orders categories by existing columns", async () => {
    const db = new CapturingDb();

    await new CategoryRepository(db).list({ limit: 10, offset: 0 });

    expect(db.calls[0]!.sql).toContain("order by name asc, id asc");
    expect(db.calls[0]!.sql).not.toContain("display_order");
  });
});
