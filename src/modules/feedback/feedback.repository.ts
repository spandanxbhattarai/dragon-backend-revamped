import { db } from '../../db';
import { feedback } from '../../db/schema';
import { eq, gte, desc, count, avg } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';
import { NotFoundError } from '../../lib/errors';

type CreateFeedbackData = typeof feedback.$inferInsert;

export const feedbackRepository = {
  findAll: async (
    filters: { rating?: number },
    pagination: PaginationResult,
  ): Promise<{ data: (typeof feedback.$inferSelect)[]; total: number }> => {
    const whereClause =
      filters.rating !== undefined ? eq(feedback.rating, filters.rating) : undefined;

    const [rows, countRows] = await Promise.all([
      whereClause
        ? db.select().from(feedback).where(whereClause).orderBy(desc(feedback.createdAt)).limit(pagination.limit).offset(pagination.offset)
        : db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(pagination.limit).offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(feedback).where(whereClause)
        : db.select({ total: count() }).from(feedback),
    ]);

    return { data: rows, total: countRows[0]?.total ?? 0 };
  },

  findPublic: async (limit = 9): Promise<(typeof feedback.$inferSelect)[]> => {
    return db
      .select()
      .from(feedback)
      .where(gte(feedback.rating, 4))
      .orderBy(desc(feedback.createdAt))
      .limit(limit);
  },

  create: async (data: CreateFeedbackData): Promise<typeof feedback.$inferSelect> => {
    const [row] = await db.insert(feedback).values(data).returning();
    return row;
  },

  reply: async (id: string, replyText: string): Promise<typeof feedback.$inferSelect> => {
    const [row] = await db
      .update(feedback)
      .set({ adminReply: replyText, repliedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    if (!row) throw new NotFoundError('Feedback not found');
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(feedback).where(eq(feedback.id, id));
  },

  getAverageRating: async (): Promise<number> => {
    const result = await db.select({ average: avg(feedback.rating) }).from(feedback);
    return Number(result[0]?.average ?? 0);
  },
};
