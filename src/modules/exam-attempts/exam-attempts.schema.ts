import { z } from 'zod';

export const startAttemptSchema = z.object({
  params: z.object({
    examId: z.string().uuid(),
  }),
});

export const saveAnswerSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
  body: z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().nullable(),
  }),
});

export const flagQuestionSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
  body: z.object({
    questionId: z.string().uuid(),
    isFlagged: z.boolean(),
  }),
});

export const submitAttemptSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
});

export const listHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    examId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
  }),
});

export const attemptIdParamSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
});

export const examIdParamSchema = z.object({
  params: z.object({ examId: z.string().uuid() }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
  }),
});
