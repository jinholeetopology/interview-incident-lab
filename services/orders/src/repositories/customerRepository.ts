import type { Db } from "@atlas/shared";
import type { Customer } from "../domain/models.js";
import { mapCustomer } from "./mapRows.js";
import type { CustomerRow } from "./rowTypes.js";

export interface CustomerRepository {
  findById(customerId: string, dbOverride?: Db): Promise<Customer | null>;
}

export const createCustomerRepository = (db: Db): CustomerRepository => ({
  async findById(customerId, dbOverride = db) {
    const rows = await dbOverride.query<CustomerRow>(
      `
      select id, code, name, tier, country, currency
      from customers
      where id = $1
      `,
      [customerId]
    );

    const row = rows[0];
    return row ? mapCustomer(row) : null;
  }
});
