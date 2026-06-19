import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(120),
    description: z.string().max(2000).optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional().nullable(),
  }),
});

// Pagination is optional: when `limit` is omitted the list endpoint returns
// every category (used by the course-form dropdown and admin page); when
// supplied it pages the result (used by the public courses page).
export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
