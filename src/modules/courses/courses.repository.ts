import { db } from '../../db';
import { courses, media } from '../../db/schema';
import { eq, and, ilike, desc, count, SQL } from 'drizzle-orm';

interface CourseFilters {
  courseType?: string;
  search?: string;
  isTrending?: boolean;
  activeOnly?: boolean;
}

interface Pagination {
  offset: number;
  limit: number;
}

const courseSelect = {
  id: courses.id,
  slug: courses.slug,
  title: courses.title,
  overview: courses.overview,
  price: courses.price,
  durationDays: courses.durationDays,
  courseType: courses.courseType,
  description: courses.description,
  image: courses.image,
  mediaId: courses.mediaId,
  isTrending: courses.isTrending,
  isActive: courses.isActive,
  freeFeatures: courses.freeFeatures,
  halfFeatures: courses.halfFeatures,
  paidFeatures: courses.paidFeatures,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  mediaUrl: media.url,
  mediaFilename: media.filename,
  mediaMimeType: media.mimeType,
};

function shapeRow(row: typeof courseSelect extends Record<string, unknown> ? any : any) {
  const { mediaUrl, mediaFilename, mediaMimeType, mediaId, ...rest } = row;
  return {
    ...rest,
    mediaId: mediaId ?? null,
    media: mediaId ? { id: mediaId, url: mediaUrl, filename: mediaFilename, mimeType: mediaMimeType } : null,
  };
}

export const coursesRepository = {
  findAll: async (filters: CourseFilters, pagination: Pagination) => {
    const conditions: SQL[] = [];

    if (filters.courseType) {
      conditions.push(eq(courses.courseType, filters.courseType as 'online' | 'offline'));
    }
    if (filters.search) {
      conditions.push(ilike(courses.title, `%${filters.search}%`));
    }
    if (filters.isTrending !== undefined) {
      conditions.push(eq(courses.isTrending, filters.isTrending));
    }
    if (filters.activeOnly) {
      conditions.push(eq(courses.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select(courseSelect)
        .from(courses)
        .leftJoin(media, eq(courses.mediaId, media.id))
        .where(whereClause)
        .orderBy(desc(courses.isTrending), desc(courses.createdAt))
        .offset(pagination.offset)
        .limit(pagination.limit),
      db.select({ count: count() }).from(courses).where(whereClause),
    ]);

    return {
      data: data.map(shapeRow),
      total: totalResult[0]?.count ?? 0,
    };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(courseSelect)
      .from(courses)
      .leftJoin(media, eq(courses.mediaId, media.id))
      .where(eq(courses.id, id))
      .limit(1);
    return row ? shapeRow(row) : null;
  },

  findBySlug: async (slug: string) => {
    const [row] = await db
      .select(courseSelect)
      .from(courses)
      .leftJoin(media, eq(courses.mediaId, media.id))
      .where(eq(courses.slug, slug))
      .limit(1);
    return row ? shapeRow(row) : null;
  },

  create: async (data: typeof courses.$inferInsert) => {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  },

  update: async (id: string, data: Partial<typeof courses.$inferInsert>) => {
    const [updated] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  },

  remove: async (id: string) => {
    await db.delete(courses).where(eq(courses.id, id));
  },

  findSlugs: async () => {
    const result = await db.select({ slug: courses.slug }).from(courses);
    return result.map((r) => r.slug);
  },
};
