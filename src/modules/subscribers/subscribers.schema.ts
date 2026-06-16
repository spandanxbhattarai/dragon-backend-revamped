import { z } from 'zod';

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const listSubscribersSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),
});

export const broadcastSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(300),
    content: z.string().min(1),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>['body'];
export type BroadcastInput = z.infer<typeof broadcastSchema>['body'];
