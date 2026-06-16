import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300),
    description: z.string().min(1, 'Description is required'),
    image: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    privacy: z.enum(['public', 'enrolled']).default('public'),
    courseId: z.string().uuid().optional().nullable(),
    resourceMediaIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    privacy: z.enum(['public', 'enrolled']).optional(),
    courseId: z.string().uuid().optional().nullable(),
    resourceMediaIds: z.array(z.string().uuid()).optional(),
  }),
});

export const listAnnouncementsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
    privacy: z.string().optional(),
  }),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>['body'];
