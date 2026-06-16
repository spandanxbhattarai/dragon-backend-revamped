import { db } from '../../db';
import { advertisements, media } from '../../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';

const adSelect = {
  id: advertisements.id,
  title: advertisements.title,
  description: advertisements.description,
  imageUrl: advertisements.imageUrl,
  mediaId: advertisements.mediaId,
  linkUrl: advertisements.linkUrl,
  buttonText: advertisements.buttonText,
  redirectUrl: advertisements.redirectUrl,
  privacy: advertisements.privacy,
  isActive: advertisements.isActive,
  createdAt: advertisements.createdAt,
  updatedAt: advertisements.updatedAt,
  mediaUrl: media.url,
  mediaFilename: media.filename,
  mediaMimeType: media.mimeType,
};

function shapeRow(row: any) {
  const { mediaUrl, mediaFilename, mediaMimeType, mediaId, ...rest } = row;
  return {
    ...rest,
    mediaId: mediaId ?? null,
    media: mediaId ? { id: mediaId, url: mediaUrl, filename: mediaFilename, mimeType: mediaMimeType } : null,
  };
}

export const advertisementsRepository = {
  findAll: async (
    filters: { isActive?: boolean },
    pagination: PaginationResult,
  ) => {
    const whereClause =
      filters.isActive !== undefined ? eq(advertisements.isActive, filters.isActive) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select(adSelect)
        .from(advertisements)
        .leftJoin(media, eq(advertisements.mediaId, media.id))
        .where(whereClause)
        .orderBy(desc(advertisements.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(advertisements).where(whereClause)
        : db.select({ total: count() }).from(advertisements),
    ]);

    return { data: rows.map(shapeRow), total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(adSelect)
      .from(advertisements)
      .leftJoin(media, eq(advertisements.mediaId, media.id))
      .where(eq(advertisements.id, id))
      .limit(1);
    return row ? shapeRow(row) : null;
  },

  create: async (data: typeof advertisements.$inferInsert) => {
    const [row] = await db.insert(advertisements).values(data).returning();
    return row;
  },

  update: async (
    id: string,
    data: Partial<typeof advertisements.$inferInsert>,
  ) => {
    const [row] = await db
      .update(advertisements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  },
};
