import { z } from 'zod';

const turnSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().min(1).max(4000),
});

export const messageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    // Recent conversation turns held client-side and replayed each request so
    // the assistant has short context. Capped here; the service trims again.
    history: z.array(turnSchema).max(12).optional().default([]),
  }),
});

export type ChatMessageInput = z.infer<typeof messageSchema>['body'];
export type ChatTurn = z.infer<typeof turnSchema>;
