import { z } from 'zod';

export const createSheetSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
  }),
});

export const updateSheetSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
  }),
});

export const questionOptionSchema = z.object({
  optionText: z.string().min(1),
  isCorrect: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export const createQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(5),
    marks: z.number().positive().default(1),
    sortOrder: z.number().int().default(0),
    options: z.array(questionOptionSchema)
      .min(2, 'At least 2 options required')
      .refine(opts => opts.filter(o => o.isCorrect).length === 1, {
        message: 'Exactly one option must be correct',
      }),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(5).optional(),
    marks: z.number().positive().optional(),
    sortOrder: z.number().int().optional(),
    options: z.array(questionOptionSchema).min(2).optional()
      .refine(opts => !opts || opts.filter(o => o.isCorrect).length === 1, {
        message: 'Exactly one option must be correct',
      }),
  }),
});

export const importQuestionsSchema = z.object({
  body: z.object({
    questions: z.array(z.object({
      questionText: z.string().min(5),
      marks: z.number().positive().default(1),
      options: z.array(z.object({
        optionText: z.string().min(1),
        isCorrect: z.boolean(),
      })).min(2)
        .refine(opts => opts.filter(o => o.isCorrect).length === 1, {
          message: 'Exactly one option must be correct per question',
        }),
    })).min(1),
  }),
});

export const reorderQuestionsSchema = z.object({
  body: z.object({
    orders: z.array(z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })).min(1),
  }),
});

export const listSheetsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
  }),
});

export type CreateSheetInput = z.infer<typeof createSheetSchema>['body'];
export type UpdateSheetInput = z.infer<typeof updateSheetSchema>['body'];
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>['body'];
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>['body'];
export type ImportQuestionsInput = z.infer<typeof importQuestionsSchema>['body'];
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>['body'];
