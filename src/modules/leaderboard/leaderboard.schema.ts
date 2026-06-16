import { z } from 'zod';

// from/to are interpolated into a raw SQL query, so constrain them strictly to
// YYYY-MM-DD to prevent injection and guarantee a valid ::date cast.
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const leaderboardSchema = z.object({
  query: z.object({
    examId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
  }),
});
