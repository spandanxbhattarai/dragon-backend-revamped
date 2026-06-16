import { db } from '../../db';
import { homeVideos, media } from '../../db/schema';
import { eq, asc, desc, count } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';
import { alias } from 'drizzle-orm/pg-core';

const videoMedia = alias(media, 'video_media');
const bannerMedia = alias(media, 'banner_media');

const select = {
  id: homeVideos.id,
  title: homeVideos.title,
  description: homeVideos.description,
  videoUrl: homeVideos.videoUrl,
  videoMediaId: homeVideos.videoMediaId,
  bannerImageUrl: homeVideos.bannerImageUrl,
  bannerMediaId: homeVideos.bannerMediaId,
  position: homeVideos.position,
  isActive: homeVideos.isActive,
  createdAt: homeVideos.createdAt,
  updatedAt: homeVideos.updatedAt,
  videoMediaUrl: videoMedia.url,
  videoMediaFilename: videoMedia.filename,
  videoMediaMimeType: videoMedia.mimeType,
  bannerMediaUrl: bannerMedia.url,
  bannerMediaFilename: bannerMedia.filename,
  bannerMediaMimeType: bannerMedia.mimeType,
};

function shape(row: any) {
  const {
    videoMediaUrl,
    videoMediaFilename,
    videoMediaMimeType,
    bannerMediaUrl,
    bannerMediaFilename,
    bannerMediaMimeType,
    videoMediaId,
    bannerMediaId,
    ...rest
  } = row;
  return {
    ...rest,
    videoMediaId: videoMediaId ?? null,
    bannerMediaId: bannerMediaId ?? null,
    videoMedia: videoMediaId
      ? { id: videoMediaId, url: videoMediaUrl, filename: videoMediaFilename, mimeType: videoMediaMimeType }
      : null,
    bannerMedia: bannerMediaId
      ? { id: bannerMediaId, url: bannerMediaUrl, filename: bannerMediaFilename, mimeType: bannerMediaMimeType }
      : null,
  };
}

export const homeVideosRepository = {
  findAll: async (filters: { isActive?: boolean }, pagination: PaginationResult) => {
    const whereClause =
      filters.isActive !== undefined ? eq(homeVideos.isActive, filters.isActive) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select(select)
        .from(homeVideos)
        .leftJoin(videoMedia, eq(homeVideos.videoMediaId, videoMedia.id))
        .leftJoin(bannerMedia, eq(homeVideos.bannerMediaId, bannerMedia.id))
        .where(whereClause)
        .orderBy(asc(homeVideos.position), desc(homeVideos.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(homeVideos).where(whereClause)
        : db.select({ total: count() }).from(homeVideos),
    ]);

    return { data: rows.map(shape), total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(select)
      .from(homeVideos)
      .leftJoin(videoMedia, eq(homeVideos.videoMediaId, videoMedia.id))
      .leftJoin(bannerMedia, eq(homeVideos.bannerMediaId, bannerMedia.id))
      .where(eq(homeVideos.id, id))
      .limit(1);
    return row ? shape(row) : null;
  },

  create: async (data: typeof homeVideos.$inferInsert) => {
    const [row] = await db.insert(homeVideos).values(data).returning();
    return row;
  },

  update: async (id: string, data: Partial<typeof homeVideos.$inferInsert>) => {
    const [row] = await db
      .update(homeVideos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homeVideos.id, id))
      .returning();
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(homeVideos).where(eq(homeVideos.id, id));
  },
};
