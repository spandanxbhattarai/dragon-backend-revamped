import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { media } from './media';
import { courses } from './courses';

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 300 }).notNull(),
  image: text('image'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  description: text('description').notNull().default(''),
  privacy: varchar('privacy', { length: 20 }).notNull().default('public'),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const announcementResources = pgTable('announcement_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  announcementId: uuid('announcement_id')
    .notNull()
    .references(() => announcements.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementResource = typeof announcementResources.$inferSelect;
export type NewAnnouncementResource = typeof announcementResources.$inferInsert;
