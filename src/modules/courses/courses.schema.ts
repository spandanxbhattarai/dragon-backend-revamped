import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    overview: z.string().min(1).max(500),
    price: z.number().nonnegative().optional().nullable(),
    discount: z.number().int().min(0).max(100).optional().default(0),
    durationDays: z.number().int().positive(),
    courseType: z.enum(['online', 'offline']),
    description: z.string().min(1),
    information: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    image: z.string().url().optional().nullable(),
    mediaId: z.string().uuid().optional().nullable(),
    isTrending: z.boolean().default(false),
    isActive: z.boolean().default(true),
    freeFeatures: z.string().optional().nullable(),
    halfFeatures: z.string().optional().nullable(),
    paidFeatures: z.string().optional().nullable(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    overview: z.string().min(1).max(500).optional(),
    price: z.number().nonnegative().optional().nullable(),
    discount: z.number().int().min(0).max(100).optional(),
    durationDays: z.number().int().positive().optional(),
    courseType: z.enum(['online', 'offline']).optional(),
    description: z.string().min(1).optional(),
    information: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    image: z.string().url().optional().nullable(),
    mediaId: z.string().uuid().optional().nullable(),
    isTrending: z.boolean().optional(),
    isActive: z.boolean().optional(),
    freeFeatures: z.string().optional().nullable(),
    halfFeatures: z.string().optional().nullable(),
    paidFeatures: z.string().optional().nullable(),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    courseType: z.enum(['online', 'offline']).optional(),
    search: z.string().optional(),
    isTrending: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    uncategorized: z.coerce.boolean().optional(),
  }),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>['body'];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>['body'];
export type ListCoursesQuery = z.infer<typeof listCoursesSchema>['query'];
