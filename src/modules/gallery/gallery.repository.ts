import { db } from '../../db';
import { galleryItems, media } from '../../db/schema';
import { eq, asc, desc, count } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';
import { alias } from 'drizzle-orm/pg-core';

const itemMedia = alias(media, 'item_media');
const thumbMedia = alias(media, 'thumb_media');

const select = {
  id: galleryItems.id,
  title: galleryItems.title,
  description: galleryItems.description,
  mediaType: galleryItems.mediaType,
  mediaUrl: galleryItems.mediaUrl,
  mediaId: galleryItems.mediaId,
  thumbnailUrl: galleryItems.thumbnailUrl,
  thumbnailMediaId: galleryItems.thumbnailMediaId,
  position: galleryItems.position,
  isActive: galleryItems.isActive,
  createdAt: galleryItems.createdAt,
  updatedAt: galleryItems.updatedAt,
  itemMediaUrl: itemMedia.url,
  itemMediaFilename: itemMedia.filename,
  itemMediaMimeType: itemMedia.mimeType,
  thumbMediaUrl: thumbMedia.url,
  thumbMediaFilename: thumbMedia.filename,
  thumbMediaMimeType: thumbMedia.mimeType,
};

function shape(row: any) {
  const {
    itemMediaUrl,
    itemMediaFilename,
    itemMediaMimeType,
    thumbMediaUrl,
    thumbMediaFilename,
    thumbMediaMimeType,
    mediaId,
    thumbnailMediaId,
    ...rest
  } = row;
  return {
    ...rest,
    mediaId: mediaId ?? null,
    thumbnailMediaId: thumbnailMediaId ?? null,
    media: mediaId
      ? { id: mediaId, url: itemMediaUrl, filename: itemMediaFilename, mimeType: itemMediaMimeType }
      : null,
    thumbnailMedia: thumbnailMediaId
      ? { id: thumbnailMediaId, url: thumbMediaUrl, filename: thumbMediaFilename, mimeType: thumbMediaMimeType }
      : null,
  };
}

export const galleryRepository = {
  findAll: async (filters: { isActive?: boolean }, pagination: PaginationResult) => {
    const whereClause =
      filters.isActive !== undefined ? eq(galleryItems.isActive, filters.isActive) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select(select)
        .from(galleryItems)
        .leftJoin(itemMedia, eq(galleryItems.mediaId, itemMedia.id))
        .leftJoin(thumbMedia, eq(galleryItems.thumbnailMediaId, thumbMedia.id))
        .where(whereClause)
        .orderBy(asc(galleryItems.position), desc(galleryItems.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(galleryItems).where(whereClause)
        : db.select({ total: count() }).from(galleryItems),
    ]);

    return { data: rows.map(shape), total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(select)
      .from(galleryItems)
      .leftJoin(itemMedia, eq(galleryItems.mediaId, itemMedia.id))
      .leftJoin(thumbMedia, eq(galleryItems.thumbnailMediaId, thumbMedia.id))
      .where(eq(galleryItems.id, id))
      .limit(1);
    return row ? shape(row) : null;
  },

  create: async (data: typeof galleryItems.$inferInsert) => {
    const [row] = await db.insert(galleryItems).values(data).returning();
    return row;
  },

  update: async (id: string, data: Partial<typeof galleryItems.$inferInsert>) => {
    const [row] = await db
      .update(galleryItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
  },
};
