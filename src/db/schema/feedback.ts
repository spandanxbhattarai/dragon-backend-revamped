import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  smallint,
} from 'drizzle-orm/pg-core';

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  rating: smallint('rating').notNull(),
  feedbackText: text('feedback_text').notNull(),
  adminReply: text('admin_reply'),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
