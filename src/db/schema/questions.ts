import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const questionSheets = pgTable('question_sheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sheetName: varchar('sheet_name', { length: 200 }).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sheetId: uuid('sheet_id')
    .notNull()
    .references(() => questionSheets.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  marks: numeric('marks', { precision: 5, scale: 2 }).notNull().default('1'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questionOptions = pgTable('question_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type QuestionSheet = typeof questionSheets.$inferSelect;
export type NewQuestionSheet = typeof questionSheets.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type NewQuestionOption = typeof questionOptions.$inferInsert;
