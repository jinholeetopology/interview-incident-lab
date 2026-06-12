import type { Category } from "../domain/types.js";
import type { CategoryRow } from "./repositoryTypes.js";

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id
  };
}
