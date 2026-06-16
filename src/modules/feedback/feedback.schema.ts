import { z } from 'zod';

export const createFeedbackSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email(),
    rating: z.number().int().min(1).max(5),
    feedbackText: z.string().min(5),
  }),
});

export const listFeedbackSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    rating: z.coerce.number().optional(),
  }),
});

export const replyFeedbackSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reply: z.string().min(1).max(2000) }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>['body'];
export type ReplyFeedbackInput = z.infer<typeof replyFeedbackSchema>['body'];
