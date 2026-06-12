import type { Db } from "@atlas/shared";
import { describe, expect, it } from "vitest";
import { StockLevelsRepository } from "../src/repositories/stockLevelsRepository.js";

class CapturingDb implements Db {
  readonly calls: { sql: string; params?: unknown[] }[] = [];

  constructor(private readonly rows: unknown[] = []) {}

  async query<R>(sql: string, params?: unknown[]): Promise<R[]> {
    this.calls.push(params === undefined ? { sql } : { sql, params });
    return this.rows as R[];
  }

  async withTx<R>(fn: (tx: Db) => Promise<R>): Promise<R> {
    return fn(this);
  }

  async close(): Promise<void> {}
}

describe("StockLevelsRepository atomic guards", () => {
  it("reserves with a single guarded atomic update", async () => {
    const db = new CapturingDb([{ warehouseId: "w1", productId: "p1", onHand: 10, reserved: 3 }]);
    await new StockLevelsRepository().reserveAvailable(db, "w1", "p1", 2);

    const sql = db.calls[0]!.sql;
    expect(sql).toContain("UPDATE stock_levels");
    expect(sql).toContain("reserved = reserved + $3");
    expect(sql).toContain("on_hand - reserved >= $3");
  });

  it("commits with a reserved guard", async () => {
    const db = new CapturingDb([{ warehouseId: "w1", productId: "p1", onHand: 8, reserved: 1 }]);
    await new StockLevelsRepository().commitReserved(db, "w1", "p1", 1);

    const sql = db.calls[0]!.sql;
    expect(sql).toContain("on_hand = on_hand - $3");
    expect(sql).toContain("reserved = reserved - $3");
    expect(sql).toContain("reserved >= $3");
  });

  it("releases with a reserved guard", async () => {
    const db = new CapturingDb([{ warehouseId: "w1", productId: "p1", onHand: 8, reserved: 1 }]);
    await new StockLevelsRepository().releaseReserved(db, "w1", "p1", 1);

    const sql = db.calls[0]!.sql;
    expect(sql).toContain("reserved = reserved - $3");
    expect(sql).toContain("reserved >= $3");
  });

  it("adjusts on hand with a non-negative guard", async () => {
    const db = new CapturingDb([{ warehouseId: "w1", productId: "p1", onHand: 7, reserved: 0 }]);
    await new StockLevelsRepository().adjustOnHand(db, "w1", "p1", -2);

    const sql = db.calls[0]!.sql;
    expect(sql).toContain("on_hand = on_hand + $3");
    expect(sql).toContain("on_hand + $3 >= 0");
  });
});
