import { db } from '../../db';
import { courses, media, categories, studentProfiles } from '../../db/schema';
import { eq, and, ilike, desc, count, isNull, sql, SQL } from 'drizzle-orm';

interface CourseFilters {
  courseType?: string;
  search?: string;
  isTrending?: boolean;
  activeOnly?: boolean;
  categoryId?: string;
  uncategorized?: boolean;
}

interface Pagination {
  offset: number;
  limit: number;
}

// Public-facing columns. NOTE: `information` is intentionally excluded — it can
// hold sensitive details meant only for enrolled students, so it is never sent
// by the public list / slug endpoints (or the chatbot context, which uses findAll).
const baseSelect = {
  id: courses.id,
  slug: courses.slug,
  title: courses.title,
  overview: courses.overview,
  price: courses.price,
  discount: courses.discount,
  durationDays: courses.durationDays,
  courseType: courses.courseType,
  description: courses.description,
  image: courses.image,
  mediaId: courses.mediaId,
  categoryId: courses.categoryId,
  isTrending: courses.isTrending,
  isActive: courses.isActive,
  views: courses.views,
  freeFeatures: courses.freeFeatures,
  halfFeatures: courses.halfFeatures,
  paidFeatures: courses.paidFeatures,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  mediaUrl: media.url,
  mediaFilename: media.filename,
  mediaMimeType: media.mimeType,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

// Full columns including `information` — only for admin (getById) and the
// enrolled student's own course (GET /courses/me).
const fullSelect = { ...baseSelect, information: courses.information };

function shapeRow(row: typeof fullSelect extends Record<string, unknown> ? any : any) {
  const {
    mediaUrl, mediaFilename, mediaMimeType, mediaId,
    categoryName, categorySlug, categoryId,
    ...rest
  } = row;
  return {
    ...rest,
    mediaId: mediaId ?? null,
    media: mediaId ? { id: mediaId, url: mediaUrl, filename: mediaFilename, mimeType: mediaMimeType } : null,
    categoryId: categoryId ?? null,
    category: categoryId ? { id: categoryId, name: categoryName, slug: categorySlug } : null,
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
    if (filters.categoryId) {
      conditions.push(eq(courses.categoryId, filters.categoryId));
    }
    if (filters.uncategorized) {
      conditions.push(isNull(courses.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select(baseSelect)
        .from(courses)
        .leftJoin(media, eq(courses.mediaId, media.id))
        .leftJoin(categories, eq(courses.categoryId, categories.id))
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

  // Admin-only: includes `information`.
  findById: async (id: string) => {
    const [row] = await db
      .select(fullSelect)
      .from(courses)
      .leftJoin(media, eq(courses.mediaId, media.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.id, id))
      .limit(1);
    return row ? shapeRow(row) : null;
  },

  // Public: excludes `information`.
  findBySlug: async (slug: string) => {
    const [row] = await db
      .select(baseSelect)
      .from(courses)
      .leftJoin(media, eq(courses.mediaId, media.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.slug, slug))
      .limit(1);
    return row ? shapeRow(row) : null;
  },

  // The course the given user is enrolled in (with `information`), or null.
  findEnrolledByUser: async (userId: string) => {
    const [profile] = await db
      .select({ courseId: studentProfiles.courseId })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    if (!profile?.courseId) return null;
    return coursesRepository.findById(profile.courseId);
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

  // Atomically increment a course's view counter; returns the new count or null
  // if the course doesn't exist.
  incrementViews: async (id: string) => {
    const [row] = await db
      .update(courses)
      .set({ views: sql`${courses.views} + 1` })
      .where(eq(courses.id, id))
      .returning({ views: courses.views });
    return row?.views ?? null;
  },

  // Courses ordered by views (desc) for the admin analytics view.
  findTopViewed: async (limit: number) => {
    return db
      .select({ id: courses.id, slug: courses.slug, title: courses.title, views: courses.views })
      .from(courses)
      .orderBy(desc(courses.views))
      .limit(limit);
  },
};
