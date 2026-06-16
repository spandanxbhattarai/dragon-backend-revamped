import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  numeric,
  boolean,
} from 'drizzle-orm/pg-core';
import { media } from './media';

export const courseTypeEnum = pgEnum('course_type', ['online', 'offline']);

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 160 }).unique().notNull(),
  title: varchar('title', { length: 200 }).unique().notNull(),
  overview: text('overview').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  durationDays: integer('duration_days').notNull(),
  courseType: courseTypeEnum('course_type').notNull().default('offline'),
  description: text('description').notNull(),
  image: text('image'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  isTrending: boolean('is_trending').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  freeFeatures: text('free_features'),
  halfFeatures: text('half_features'),
  paidFeatures: text('paid_features'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
