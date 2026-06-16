import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { media } from './media';
import { courses } from './courses';

export const classMaterials = pgTable('class_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ClassMaterial = typeof classMaterials.$inferSelect;
export type NewClassMaterial = typeof classMaterials.$inferInsert;
