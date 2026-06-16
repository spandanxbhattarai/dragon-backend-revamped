import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  subject: varchar('subject', { length: 300 }).notNull(),
  message: text('message').notNull(),
  // 'pending' until an admin replies, then 'replied'
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  adminReply: text('admin_reply'),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
