import { z } from 'zod';

export const createHomeVideoSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    videoUrl: z.string().min(1, 'Video is required'),
    videoMediaId: z.string().uuid().optional().nullable(),
    bannerImageUrl: z.string().optional().nullable(),
    bannerMediaId: z.string().uuid().optional().nullable(),
    position: z.coerce.number().int().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateHomeVideoSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    videoUrl: z.string().optional(),
    videoMediaId: z.string().uuid().optional().nullable(),
    bannerImageUrl: z.string().optional().nullable(),
    bannerMediaId: z.string().uuid().optional().nullable(),
    position: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listHomeVideosSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    isActive: z.string().optional(),
  }),
});

export type CreateHomeVideoInput = z.infer<typeof createHomeVideoSchema>['body'];
export type UpdateHomeVideoInput = z.infer<typeof updateHomeVideoSchema>['body'];
