import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { media } from './media';

export const homeVideos = pgTable('home_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  // video file lives in /media — we keep the resolved URL too for convenience.
  videoUrl: text('video_url').notNull(),
  videoMediaId: uuid('video_media_id').references(() => media.id, { onDelete: 'set null' }),
  // banner / poster image (1920×1080, enforced client-side at insert time)
  bannerImageUrl: text('banner_image_url'),
  bannerMediaId: uuid('banner_media_id').references(() => media.id, { onDelete: 'set null' }),
  // playback order on the home page (lower number plays first)
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type HomeVideo = typeof homeVideos.$inferSelect;
export type NewHomeVideo = typeof homeVideos.$inferInsert;
