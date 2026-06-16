import { z } from 'zod';

export const createClassMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    mediaId: z.string().uuid(),
    courseId: z.string().uuid(),
  }),
});

export const updateClassMaterialSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().optional(),
    mediaId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const listMaterialsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const materialIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type CreateClassMaterialInput = z.infer<typeof createClassMaterialSchema>['body'];
export type UpdateClassMaterialInput = z.infer<typeof updateClassMaterialSchema>['body'];
export type ListMaterialsQuery = z.infer<typeof listMaterialsSchema>['query'];
