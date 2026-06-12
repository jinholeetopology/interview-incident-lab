import type { CategoryRepository } from "../repositories/categoryRepository.js";
import type { ListResult } from "./listResult.js";
import type { Category, Pagination } from "./types.js";

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async listCategories(pagination: Pagination): Promise<ListResult<Category>> {
    return this.categories.list(pagination);
  }
}
