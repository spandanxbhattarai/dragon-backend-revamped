import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { media } from './media';

export const galleryMediaTypeEnum = pgEnum('gallery_media_type', ['image', 'video']);

export const galleryItems = pgTable('gallery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  mediaType: galleryMediaTypeEnum('media_type').notNull().default('image'),
  // image or video file lives in /media — we keep the resolved URL too for convenience.
  mediaUrl: text('media_url').notNull(),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  // optional poster (for videos) or thumbnail override (for images)
  thumbnailUrl: text('thumbnail_url'),
  thumbnailMediaId: uuid('thumbnail_media_id').references(() => media.id, { onDelete: 'set null' }),
  // display order on the home page / gallery (lower number first)
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;
