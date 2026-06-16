import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { media } from './media';
import { courses } from './courses';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description').notNull().default(''),
  category: varchar('category', { length: 100 }).notNull().default('Other'),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  address: text('address'),
  privacy: varchar('privacy', { length: 20 }).notNull().default('public'),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  image: text('image'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventResources = pgTable('event_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventResource = typeof eventResources.$inferSelect;
export type NewEventResource = typeof eventResources.$inferInsert;
