import { z } from 'zod';

const privacyEnum = z.enum(['public', 'enrolled']);

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300),
    description: z.string().min(1, 'Description is required'),
    category: z.string().default('Other'),
    eventDate: z.coerce.date(),
    address: z.string().optional(),
    privacy: privacyEnum.default('public'),
    courseId: z.string().uuid().optional().nullable(),
    image: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    resourceMediaIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    eventDate: z.coerce.date().optional(),
    address: z.string().optional(),
    privacy: privacyEnum.optional(),
    courseId: z.string().uuid().optional().nullable(),
    image: z.string().optional(),
    mediaId: z.string().uuid().optional().nullable(),
    resourceMediaIds: z.array(z.string().uuid()).optional(),
  }),
});

export const listEventsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    privacy: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
