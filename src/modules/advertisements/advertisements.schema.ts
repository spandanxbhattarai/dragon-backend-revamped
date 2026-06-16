import { z } from 'zod';

export const createAdSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    linkUrl: z.string().url().optional(),
    buttonText: z.string().max(100).optional(),
    redirectUrl: z.string().url().optional(),
    // 'all'    = shown to everyone (signed in or not)
    // 'guests' = shown only to non-authenticated visitors
    privacy: z.enum(['all', 'guests']).default('all'),
    isActive: z.boolean().default(true),
  }),
});

export const updateAdSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    linkUrl: z.string().url().optional(),
    buttonText: z.string().max(100).optional().nullable(),
    redirectUrl: z.string().url().optional().nullable(),
    privacy: z.enum(['all', 'guests']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listAdsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    isActive: z.string().optional(),
  }),
});

export type CreateAdInput = z.infer<typeof createAdSchema>['body'];
export type UpdateAdInput = z.infer<typeof updateAdSchema>['body'];
