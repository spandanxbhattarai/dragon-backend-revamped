import { z } from 'zod';

export const createMediaSchema = z.object({
  body: z.object({
    filename: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().positive(),
    url: z.string().url(),
    s3Key: z.string().optional(),
  }),
});

export const listMediaSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    mimeType: z.string().optional(),
  }),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>['body'];
export type ListMediaQuery = z.infer<typeof listMediaSchema>['query'];
