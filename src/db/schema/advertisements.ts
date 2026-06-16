import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { media } from './media';

export const advertisements = pgTable('advertisements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  linkUrl: text('link_url'),
  buttonText: varchar('button_text', { length: 100 }),
  redirectUrl: text('redirect_url'),
  // 'all' shows to everyone; 'guests' shows only to non-authenticated visitors.
  privacy: varchar('privacy', { length: 20 }).notNull().default('all'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type NewAdvertisement = typeof advertisements.$inferInsert;
