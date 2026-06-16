import { z } from 'zod';

export const heartbeatSchema = z.object({
  body: z.object({
    sessionToken: z.string().min(1),
    pagePath: z.string().optional(),
  }),
});

export const pageviewSchema = z.object({
  body: z.object({
    sessionToken: z.string().min(1),
    pagePath: z.string().min(1),
    utmSource: z.string().optional(),
  }),
});

export const dailyStatsSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});
