import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email(),
    phone: z.string().max(40).optional().or(z.literal('')),
    subject: z.string().min(3).max(300),
    message: z.string().min(20),
  }),
});

export const listContactSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    status: z.enum(['pending', 'replied']).optional(),
    search: z.string().optional(),
  }),
});

export const replyContactSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reply: z.string().min(1).max(2000) }),
});

export type CreateContactInput = z.infer<typeof createContactSchema>['body'];
export type ReplyContactInput = z.infer<typeof replyContactSchema>['body'];
