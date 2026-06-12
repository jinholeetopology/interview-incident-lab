import type { Db } from "@atlas/shared";
import type {
  Pagination,
  Product,
  ProductCreateInput,
  ProductListFilters,
  ProductPatchInput
} from "../domain/types.js";
import type { ListResult } from "../domain/listResult.js";
import { addParam, whereClause } from "./sql.js";
import { mapProductRow } from "./productMapper.js";
import type { CountRow, ProductRow } from "./repositoryTypes.js";

const PRODUCT_COLUMNS = `
  id, sku, name, description, category_id, base_price_cents,
  currency, status, created_at, updated_at
`;

export class ProductRepository {
  constructor(private readonly db: Db) {}

  async list(filters: ProductListFilters, pagination: Pagination): Promise<ListResult<Product>> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.categoryId) {
      conditions.push(`category_id = ${addParam(params, filters.categoryId)}`);
    }

    if (filters.status) {
      conditions.push(`status = ${addParam(params, filters.status)}`);
    }

    if (filters.sku) {
      conditions.push(`sku = ${addParam(params, filters.sku)}`);
    }

    const where = whereClause(conditions);
    const limitParam = addParam(params, pagination.limit);
    const offsetParam = addParam(params, pagination.offset);

    const rows = await this.db.query<ProductRow>(
      `select ${PRODUCT_COLUMNS}
       from products${where}
       order by created_at desc, id asc
       limit ${limitParam} offset ${offsetParam}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countRows = await this.db.query<CountRow>(
      `select count(*)::int as total from products${where}`,
      countParams
    );

    return {
      items: rows.map(mapProductRow),
      total: Number(countRows[0]?.total ?? 0)
    };
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await this.db.query<ProductRow>(
      `select ${PRODUCT_COLUMNS} from products where id = $1`,
      [id]
    );
    return rows[0] ? mapProductRow(rows[0]) : null;
  }

  async create(id: string, input: ProductCreateInput): Promise<Product> {
    const rows = await this.db.query<ProductRow>(
      `insert into products (
         id, sku, name, description, category_id, base_price_cents,
         currency, status, created_at, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
       returning ${PRODUCT_COLUMNS}`,
      [
        id,
        input.sku,
        input.name,
        input.description,
        input.categoryId,
        input.basePriceCents,
        input.currency,
        input.status
      ]
    );
    return mapProductRow(rows[0]!);
  }

  async update(id: string, patch: ProductPatchInput): Promise<Product | null> {
    const params: unknown[] = [];
    const assignments: string[] = [];
    const assign = (column: string, value: unknown) => {
      if (value !== undefined) {
        assignments.push(`${column} = ${addParam(params, value)}`);
      }
    };

    assign("sku", patch.sku);
    assign("name", patch.name);
    assign("description", patch.description);
    assign("category_id", patch.categoryId);
    assign("base_price_cents", patch.basePriceCents);
    assign("currency", patch.currency);
    assign("status", patch.status);

    if (assignments.length === 0) {
      return this.findById(id);
    }

    const idParam = addParam(params, id);
    const rows = await this.db.query<ProductRow>(
      `update products
       set ${assignments.join(", ")}, updated_at = now()
       where id = ${idParam}
       returning ${PRODUCT_COLUMNS}`,
      params
    );

    return rows[0] ? mapProductRow(rows[0]) : null;
  }
}
