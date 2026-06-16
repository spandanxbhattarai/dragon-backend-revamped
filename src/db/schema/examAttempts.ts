import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  numeric,
  integer,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { exams } from './exams';
import { questions } from './questions';
import { questionOptions } from './questions';

export const attemptStatusEnum = pgEnum('attempt_status', [
  'in_progress',
  'submitted',
  'expired',
  'abandoned',
]);

export const examAttempts = pgTable(
  'exam_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    status: attemptStatusEnum('status').notNull().default('in_progress'),
    totalMarks: numeric('total_marks', { precision: 8, scale: 2 }),
    marksObtained: numeric('marks_obtained', { precision: 8, scale: 2 }),
    correctAnswers: integer('correct_answers'),
    incorrectAnswers: integer('incorrect_answers'),
    unanswered: integer('unanswered'),
    percentage: numeric('percentage', { precision: 5, scale: 2 }),
    timeTakenSeconds: integer('time_taken_seconds'),
  },
  (t) => [unique().on(t.userId, t.examId)],
);

export const examAttemptAnswers = pgTable('exam_attempt_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id')
    .notNull()
    .references(() => examAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  selectedOptionId: uuid('selected_option_id').references(() => questionOptions.id),
  isCorrect: boolean('is_correct'),
  isFlagged: boolean('is_flagged').notNull().default(false),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
});

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type NewExamAttempt = typeof examAttempts.$inferInsert;
export type ExamAttemptAnswer = typeof examAttemptAnswers.$inferSelect;
export type NewExamAttemptAnswer = typeof examAttemptAnswers.$inferInsert;
