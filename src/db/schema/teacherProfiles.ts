import { pgTable, uuid, text, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const teacherProfiles = pgTable('teacher_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  specialization: varchar('specialization', { length: 200 }),
  enableDisplayInAbout: boolean('enable_display_in_about').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const teacherCourses = pgTable(
  'teacher_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teacherProfileId: uuid('teacher_profile_id')
      .notNull()
      .references(() => teacherProfiles.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.teacherProfileId, t.courseId),
  }),
);

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type NewTeacherProfile = typeof teacherProfiles.$inferInsert;
export type TeacherCourse = typeof teacherCourses.$inferSelect;
export type NewTeacherCourse = typeof teacherCourses.$inferInsert;
