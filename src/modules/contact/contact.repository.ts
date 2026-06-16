import { db } from '../../db';
import { contactMessages } from '../../db/schema';
import { eq, and, or, ilike, desc, count, type SQL } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';
import { NotFoundError } from '../../lib/errors';

type CreateContactData = typeof contactMessages.$inferInsert;

export const contactRepository = {
  findAll: async (
    filters: { status?: 'pending' | 'replied'; search?: string },
    pagination: PaginationResult,
  ): Promise<{ data: (typeof contactMessages.$inferSelect)[]; total: number }> => {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(contactMessages.status, filters.status));
    if (filters.search) {
      const term = `%${filters.search}%`;
      const search = or(
        ilike(contactMessages.name, term),
        ilike(contactMessages.email, term),
        ilike(contactMessages.subject, term),
      );
      if (search) conditions.push(search);
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(whereClause)
        .orderBy(desc(contactMessages.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ total: count() }).from(contactMessages).where(whereClause),
    ]);

    return { data: rows, total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string): Promise<typeof contactMessages.$inferSelect | undefined> => {
    const [row] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return row;
  },

  create: async (data: CreateContactData): Promise<typeof contactMessages.$inferSelect> => {
    const [row] = await db.insert(contactMessages).values(data).returning();
    return row;
  },

  reply: async (id: string, replyText: string): Promise<typeof contactMessages.$inferSelect> => {
    const [row] = await db
      .update(contactMessages)
      .set({ adminReply: replyText, repliedAt: new Date(), status: 'replied' })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!row) throw new NotFoundError('Contact message not found');
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  },

  getStats: async (): Promise<{ total: number; pending: number; replied: number }> => {
    const [totalRows, pendingRows, repliedRows] = await Promise.all([
      db.select({ total: count() }).from(contactMessages),
      db.select({ total: count() }).from(contactMessages).where(eq(contactMessages.status, 'pending')),
      db.select({ total: count() }).from(contactMessages).where(eq(contactMessages.status, 'replied')),
    ]);
    return {
      total: totalRows[0]?.total ?? 0,
      pending: pendingRows[0]?.total ?? 0,
      replied: repliedRows[0]?.total ?? 0,
    };
  },
};
