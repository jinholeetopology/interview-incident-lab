import type { Db } from "@atlas/shared";
import type { ReservationLineRow, ReservationRow } from "./repositoryTypes.js";
import { reservationColumns, reservationLineColumns } from "./queryFragments.js";

export class ReservationsRepository {
  async createPending(
    db: Db,
    id: string,
    orderId: string,
    expiresAt: Date
  ): Promise<ReservationRow> {
    const rows = await db.query<ReservationRow>(
      `
        INSERT INTO stock_reservations (id, order_id, status, expires_at, created_at)
        VALUES ($1, $2, 'pending', $3, now())
        RETURNING ${reservationColumns}
      `,
      [id, orderId, expiresAt]
    );

    return rows[0]!;
  }

  async insertLine(
    db: Db,
    id: string,
    reservationId: string,
    productId: string,
    warehouseId: string,
    qty: number
  ): Promise<ReservationLineRow> {
    const rows = await db.query<ReservationLineRow>(
      `
        INSERT INTO stock_reservation_lines (id, reservation_id, product_id, warehouse_id, qty)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${reservationLineColumns}
      `,
      [id, reservationId, productId, warehouseId, qty]
    );

    return rows[0]!;
  }

  async findByIdForUpdate(db: Db, reservationId: string): Promise<ReservationRow | null> {
    const rows = await db.query<ReservationRow>(
      `
        SELECT ${reservationColumns}
        FROM stock_reservations
        WHERE id = $1
        FOR UPDATE
      `,
      [reservationId]
    );

    return rows[0] ?? null;
  }

  async findById(db: Db, reservationId: string): Promise<ReservationRow | null> {
    const rows = await db.query<ReservationRow>(
      `
        SELECT ${reservationColumns}
        FROM stock_reservations
        WHERE id = $1
      `,
      [reservationId]
    );

    return rows[0] ?? null;
  }

  async listLines(db: Db, reservationId: string): Promise<ReservationLineRow[]> {
    return db.query<ReservationLineRow>(
      `
        SELECT ${reservationLineColumns}
        FROM stock_reservation_lines
        WHERE reservation_id = $1
        ORDER BY product_id, warehouse_id, id
      `,
      [reservationId]
    );
  }

  async setStatus(
    db: Db,
    reservationId: string,
    status: ReservationRow["status"]
  ): Promise<ReservationRow> {
    const rows = await db.query<ReservationRow>(
      `
        UPDATE stock_reservations
        SET status = $2
        WHERE id = $1
        RETURNING ${reservationColumns}
      `,
      [reservationId, status]
    );

    return rows[0]!;
  }

  async listExpiredPending(db: Db, limit: number): Promise<ReservationRow[]> {
    return db.query<ReservationRow>(
      `
        SELECT ${reservationColumns}
        FROM stock_reservations
        WHERE status = 'pending'
          AND expires_at <= now()
        ORDER BY expires_at, id
        LIMIT $1
      `,
      [limit]
    );
  }
}
