import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const analyticsDaily = pgTable('analytics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').unique().notNull(),
  totalVisitors: integer('total_visitors').notNull().default(0),
  totalPageViews: integer('total_page_views').notNull().default(0),
  newRegistrations: integer('new_registrations').notNull().default(0),
  planFree: integer('plan_free').notNull().default(0),
  planHalf: integer('plan_half').notNull().default(0),
  planFull: integer('plan_full').notNull().default(0),
  subscribersGained: integer('subscribers_gained').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per visitor session per day. The composite primary key is what makes
// `onConflictDoNothing()` able to detect a repeat visit — without it every
// pageview was wrongly counted as a brand-new visitor.
export const analyticsVisitorSessions = pgTable('analytics_visitor_sessions', {
  sessionToken: varchar('session_token', { length: 255 }).notNull(),
  date: date('date').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.sessionToken, t.date] }),
}));

// One row per (session, page path, day). Lets us count a page view exactly once
// even if the same page is reloaded or the client retries the request.
export const analyticsPageViews = pgTable('analytics_page_views', {
  sessionToken: varchar('session_token', { length: 255 }).notNull(),
  pagePath: varchar('page_path', { length: 500 }).notNull(),
  date: date('date').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.sessionToken, t.pagePath, t.date] }),
}));

export const analyticsUtmSources = pgTable('analytics_utm_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date')
    .notNull()
    .references(() => analyticsDaily.date, { onDelete: 'cascade' }),
  source: varchar('source', { length: 100 }).notNull(),
  visits: integer('visits').notNull().default(0),
});

export const activeSessions = pgTable('active_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull(),
  pagePath: varchar('page_path', { length: 500 }),
  lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

export type AnalyticsVisitorSession = typeof analyticsVisitorSessions.$inferSelect;
export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;
export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDaily = typeof analyticsDaily.$inferInsert;
export type AnalyticsUtmSource = typeof analyticsUtmSources.$inferSelect;
export type NewAnalyticsUtmSource = typeof analyticsUtmSources.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type NewActiveSession = typeof activeSessions.$inferInsert;
