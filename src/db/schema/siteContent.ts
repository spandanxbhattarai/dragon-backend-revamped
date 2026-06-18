import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Editable page content for public sections (home + about). Each row holds one
// section, keyed by a stable string (e.g. 'home.hero'), with the section's
// content stored as a JSON blob whose shape is validated per-key in the module.
export const siteContent = pgTable('site_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;
