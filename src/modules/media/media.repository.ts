import { db } from '../../db';
import { media, users } from '../../db/schema';
import { eq, ilike, desc, count, and } from 'drizzle-orm';

const selectShape = {
  id: media.id,
  filename: media.filename,
  originalName: media.originalName,
  mimeType: media.mimeType,
  size: media.size,
  url: media.url,
  s3Key: media.s3Key,
  createdAt: media.createdAt,
  uploadedBy: {
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
  },
};

export const mediaRepository = {
  findAll: async (filters: { search?: string; mimeType?: string }, pagination: { limit: number; offset: number }) => {
    const conditions = [];
    if (filters.search) conditions.push(ilike(media.originalName, `%${filters.search}%`));
    if (filters.mimeType) conditions.push(ilike(media.mimeType, `%${filters.mimeType}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db.select(selectShape).from(media).leftJoin(users, eq(media.uploadedBy, users.id)).where(where).orderBy(desc(media.createdAt)).limit(pagination.limit).offset(pagination.offset),
      db.select({ total: count() }).from(media).where(where),
    ]);
    return { data: rows, total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db.select(selectShape).from(media).leftJoin(users, eq(media.uploadedBy, users.id)).where(eq(media.id, id));
    return row ?? null;
  },

  create: async (data: typeof media.$inferInsert) => {
    const [row] = await db.insert(media).values(data).returning();
    return row;
  },

  remove: async (id: string) => {
    await db.delete(media).where(eq(media.id, id));
  },
};
