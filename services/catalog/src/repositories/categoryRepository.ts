import type { Db } from "@atlas/shared";
import type { ListResult } from "../domain/listResult.js";
import type { Category, Pagination } from "../domain/types.js";
import { mapCategoryRow } from "./categoryMapper.js";
import type { CategoryRow, CountRow } from "./repositoryTypes.js";

const CATEGORY_COLUMNS = "id, name, parent_id";

export class CategoryRepository {
  constructor(private readonly db: Db) {}

  async list(pagination: Pagination): Promise<ListResult<Category>> {
    const rows = await this.db.query<CategoryRow>(
      `select ${CATEGORY_COLUMNS}
       from categories
       order by display_order asc, id asc
       limit $1 offset $2`,
      [pagination.limit, pagination.offset]
    );
    const countRows = await this.db.query<CountRow>("select count(*)::int as total from categories");

    return {
      items: rows.map(mapCategoryRow),
      total: Number(countRows[0]?.total ?? 0)
    };
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await this.db.query<CategoryRow>(
      `select ${CATEGORY_COLUMNS} from categories where id = $1`,
      [id]
    );
    return rows[0] ? mapCategoryRow(rows[0]) : null;
  }
}
