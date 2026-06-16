import { z } from 'zod';

const planEnum = z.enum(['free', 'half', 'paid']);

export const createExamSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
    // totalMarks is derived from the question sheet — not accepted from the client.
    passMarks: z.coerce.number().positive().optional(),
    durationMinutes: z.coerce.number().int().min(1),
    negativeMarking: z.boolean().default(false),
    negativeMarkingValue: z.coerce.number().min(0).max(100).optional(),
    questionSheetId: z.string().uuid(),
    courseId: z.string().uuid().optional().nullable(),
    accessPlans: z.array(planEnum).min(1).default(['free', 'half', 'paid']),
  }),
});

export const updateExamSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    startDateTime: z.coerce.date().optional(),
    endDateTime: z.coerce.date().optional(),
    passMarks: z.coerce.number().positive().optional(),
    durationMinutes: z.coerce.number().int().min(1).optional(),
    negativeMarking: z.boolean().optional(),
    negativeMarkingValue: z.coerce.number().min(0).max(100).optional(),
    questionSheetId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional().nullable(),
    accessPlans: z.array(planEnum).min(1).optional(),
  }),
});

export const listExamsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
    plan: planEnum.optional(),
    status: z.enum(['upcoming', 'active', 'ended']).optional(),
  }),
});

export type CreateExamInput = z.infer<typeof createExamSchema>['body'];
export type UpdateExamInput = z.infer<typeof updateExamSchema>['body'];
