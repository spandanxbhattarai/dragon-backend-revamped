import { pgTable, pgEnum, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const studentPlanEnum = pgEnum('student_plan', ['free', 'half', 'paid']);

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: studentPlanEnum('plan').notNull().default('free'),
  courseId: uuid('course_id').references(() => courses.id),
  paymentImage: text('payment_image'),
  citizenshipCertificate: text('citizenship_certificate'),
  initialVerification: boolean('initial_verification').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type NewStudentProfile = typeof studentProfiles.$inferInsert;
