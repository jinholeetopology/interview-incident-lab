import type { Db } from "@atlas/shared";
import type { Shipment, ShipmentStatus } from "../domain/models.js";
import { mapShipment } from "./mapRows.js";
import type { ShipmentRow } from "./rowTypes.js";

export interface CreateShipmentInput {
  id: string;
  orderId: string;
  carrier: string;
  trackingNo: string;
}

export interface ShipmentRepository {
  create(input: CreateShipmentInput, dbOverride?: Db): Promise<Shipment>;
  findByOrderId(orderId: string, dbOverride?: Db): Promise<Shipment | null>;
  findByOrderIdForUpdate(orderId: string, dbOverride?: Db): Promise<Shipment | null>;
  listReadyToAdvance(): Promise<Shipment[]>;
  advanceStatus(
    shipmentId: string,
    from: ShipmentStatus,
    to: ShipmentStatus
  ): Promise<Shipment | null>;
}

const shipmentSelect = `
  select id, order_id, status, carrier, tracking_no, created_at
  from shipments
`;

export const createShipmentRepository = (db: Db): ShipmentRepository => ({
  async create(input, dbOverride = db) {
    const rows = await dbOverride.query<ShipmentRow>(
      `
      insert into shipments (id, order_id, status, carrier, tracking_no, created_at)
      values ($1, $2, 'preparing', $3, $4, now())
      returning id, order_id, status, carrier, tracking_no, created_at
      `,
      [input.id, input.orderId, input.carrier, input.trackingNo]
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Shipment insert did not return a row");
    }
    return mapShipment(row);
  },

  async findByOrderId(orderId, dbOverride = db) {
    const rows = await dbOverride.query<ShipmentRow>(
      `
      ${shipmentSelect}
      where order_id = $1
      order by created_at desc
      limit 1
      `,
      [orderId]
    );

    const row = rows[0];
    return row ? mapShipment(row) : null;
  },

  async findByOrderIdForUpdate(orderId, dbOverride = db) {
    const rows = await dbOverride.query<ShipmentRow>(
      `
      ${shipmentSelect}
      where order_id = $1
      order by created_at desc
      limit 1
      for update
      `,
      [orderId]
    );

    const row = rows[0];
    return row ? mapShipment(row) : null;
  },

  async listReadyToAdvance() {
    const rows = await db.query<ShipmentRow>(
      `
      ${shipmentSelect}
      where (status = 'preparing' and created_at <= now() - interval '2 seconds')
         or (status = 'dispatched' and created_at <= now() - interval '8 seconds')
      order by created_at asc
      limit 50
      `
    );

    return rows.map(mapShipment);
  },

  async advanceStatus(shipmentId, from, to) {
    const rows = await db.query<ShipmentRow>(
      `
      update shipments
      set status = $2
      where id = $1
        and status = $3
      returning id, order_id, status, carrier, tracking_no, created_at
      `,
      [shipmentId, to, from]
    );

    const row = rows[0];
    return row ? mapShipment(row) : null;
  }
});
