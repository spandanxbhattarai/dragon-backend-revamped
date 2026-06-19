import { z } from 'zod';

export const createGallerySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title required').max(200),
    description: z.string().optional().nullable(),
    mediaType: z.enum(['image', 'video']),
    mediaUrl: z.string().min(1, 'Media is required'),
    mediaId: z.string().uuid().optional().nullable(),
    thumbnailUrl: z.string().optional().nullable(),
    thumbnailMediaId: z.string().uuid().optional().nullable(),
    position: z.coerce.number().int().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateGallerySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    mediaType: z.enum(['image', 'video']).optional(),
    mediaUrl: z.string().min(1).optional(),
    mediaId: z.string().uuid().optional().nullable(),
    thumbnailUrl: z.string().optional().nullable(),
    thumbnailMediaId: z.string().uuid().optional().nullable(),
    position: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listGallerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    isActive: z.string().optional(),
  }),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>['body'];
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>['body'];
