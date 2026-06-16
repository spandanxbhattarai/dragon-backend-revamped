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
import { sql } from 'drizzle-orm';
import { questionSheets } from './questions';
import { courses } from './courses';

export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  examCode: varchar('exam_code', { length: 50 }).unique().notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startDateTime: timestamp('start_date_time', { withTimezone: true }).notNull(),
  endDateTime: timestamp('end_date_time', { withTimezone: true }).notNull(),
  totalMarks: numeric('total_marks', { precision: 8, scale: 2 }).notNull(),
  passMarks: numeric('pass_marks', { precision: 8, scale: 2 }),
  durationMinutes: integer('duration_minutes').notNull(),
  negativeMarking: boolean('negative_marking').notNull().default(false),
  negativeMarkingValue: numeric('negative_marking_value', { precision: 5, scale: 2 }),
  questionSheetId: uuid('question_sheet_id')
    .notNull()
    .references(() => questionSheets.id),
  // Course-targeting: null means available to any enrolled student that
  // matches accessPlans; set means visible only to students enrolled in
  // that course.
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  accessPlans: text('access_plans').array().notNull().default(sql`ARRAY['free','half','paid']::text[]`),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
