import { db } from '../../db';
import { subscribers } from '../../db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';

export const subscribersRepository = {
  findByEmail: async (email: string): Promise<(typeof subscribers.$inferSelect) | null> => {
    const [row] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    return row ?? null;
  },

  findAll: async (
    pagination: PaginationResult,
  ): Promise<{ data: (typeof subscribers.$inferSelect)[]; total: number }> => {
    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(subscribers)
        .orderBy(desc(subscribers.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ total: count() }).from(subscribers),
    ]);

    return { data: rows, total: countRows[0]?.total ?? 0 };
  },

  findAllEmails: async (): Promise<string[]> => {
    const rows = await db.select({ email: subscribers.email }).from(subscribers);
    return rows.map((r) => r.email);
  },

  create: async (email: string): Promise<typeof subscribers.$inferSelect> => {
    const [row] = await db.insert(subscribers).values({ email }).returning();
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(subscribers).where(eq(subscribers.id, id));
  },
};
