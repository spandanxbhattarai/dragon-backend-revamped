import { categoriesRepository } from './categories.repository';
import { generateUniqueSlug } from '../../utils/slugify';
import { paginate, paginationMeta } from '../../utils/paginate';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export const categoriesService = {
  list: async (query?: { page?: number; limit?: number }) => {
    // No limit → return all (dropdowns / admin). With limit → paginate.
    if (!query?.limit) {
      const data = await categoriesRepository.findAll();
      return { data };
    }
    const pagination = paginate({ page: query.page, limit: query.limit });
    const [data, total] = await Promise.all([
      categoriesRepository.findAll({ offset: pagination.offset, limit: pagination.limit }),
      categoriesRepository.countAll(),
    ]);
    return { data, meta: paginationMeta(total, pagination.page, pagination.limit) };
  },

  getById: async (id: string) => {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  },

  create: async (input: CreateCategoryInput) => {
    const existingSlugs = await categoriesRepository.findSlugs();
    const slug = generateUniqueSlug(input.name, existingSlugs);
    try {
      return await categoriesRepository.create({
        name: input.name,
        slug,
        description: input.description ?? null,
      });
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictError('A category with this name already exists');
      }
      throw err;
    }
  },

  update: async (id: string, input: UpdateCategoryInput) => {
    const existing = await categoriesRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    let slug: string | undefined;
    if (input.name && input.name !== existing.name) {
      const existingSlugs = (await categoriesRepository.findSlugs()).filter(
        (s) => s !== existing.slug,
      );
      slug = generateUniqueSlug(input.name, existingSlugs);
    }

    try {
      return await categoriesRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(slug ? { slug } : {}),
      });
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictError('A category with this name already exists');
      }
      throw err;
    }
  },

  remove: async (id: string) => {
    const existing = await categoriesRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');
    // Courses referencing this category have category_id set to null (FK onDelete).
    await categoriesRepository.remove(id);
  },
};
