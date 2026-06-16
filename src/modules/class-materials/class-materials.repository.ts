import { db } from '../../db';
import { classMaterials, users, media, courses, studentProfiles } from '../../db/schema';
import { eq, ilike, desc, count, and, SQL } from 'drizzle-orm';
import type { PaginationResult } from '../../utils/paginate';

type CreateMaterialData = {
  title: string;
  description?: string | null;
  mediaId: string;
  courseId: string;
  fileUrl?: string | null;
  createdBy?: string | null;
};

type UpdateMaterialData = Partial<{
  title: string;
  description: string | null;
  mediaId: string;
  courseId: string;
  fileUrl: string | null;
}>;

const detailedSelect = {
  id: classMaterials.id,
  title: classMaterials.title,
  description: classMaterials.description,
  fileUrl: classMaterials.fileUrl,
  mediaId: classMaterials.mediaId,
  courseId: classMaterials.courseId,
  createdAt: classMaterials.createdAt,
  updatedAt: classMaterials.updatedAt,
  media: {
    id: media.id,
    url: media.url,
    s3Key: media.s3Key,
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
  },
  course: {
    id: courses.id,
    title: courses.title,
    slug: courses.slug,
  },
  createdBy: {
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
  },
};

function buildWhere(filters: { search?: string; courseId?: string }): SQL | undefined {
  const conds: SQL[] = [];
  if (filters.search) conds.push(ilike(classMaterials.title, `%${filters.search}%`));
  if (filters.courseId) conds.push(eq(classMaterials.courseId, filters.courseId));
  if (conds.length === 0) return undefined;
  if (conds.length === 1) return conds[0];
  return and(...conds);
}

export const classMaterialsRepository = {
  findAll: async (
    filters: { search?: string; courseId?: string },
    pagination: PaginationResult,
  ) => {
    const whereClause = buildWhere(filters);

    const baseQuery = db
      .select(detailedSelect)
      .from(classMaterials)
      .leftJoin(users, eq(classMaterials.createdBy, users.id))
      .leftJoin(media, eq(classMaterials.mediaId, media.id))
      .leftJoin(courses, eq(classMaterials.courseId, courses.id));

    const countQuery = db.select({ total: count() }).from(classMaterials);

    const [rows, countRows] = await Promise.all([
      whereClause
        ? baseQuery.where(whereClause).orderBy(desc(classMaterials.createdAt)).limit(pagination.limit).offset(pagination.offset)
        : baseQuery.orderBy(desc(classMaterials.createdAt)).limit(pagination.limit).offset(pagination.offset),
      whereClause ? countQuery.where(whereClause) : countQuery,
    ]);

    return { data: rows, total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [material] = await db
      .select(detailedSelect)
      .from(classMaterials)
      .leftJoin(users, eq(classMaterials.createdBy, users.id))
      .leftJoin(media, eq(classMaterials.mediaId, media.id))
      .leftJoin(courses, eq(classMaterials.courseId, courses.id))
      .where(eq(classMaterials.id, id));
    return material ?? null;
  },

  create: async (data: CreateMaterialData): Promise<typeof classMaterials.$inferSelect> => {
    const [row] = await db
      .insert(classMaterials)
      .values({
        title: data.title,
        description: data.description ?? null,
        mediaId: data.mediaId,
        courseId: data.courseId,
        fileUrl: data.fileUrl ?? null,
        createdBy: data.createdBy ?? null,
      })
      .returning();
    return row;
  },

  update: async (
    id: string,
    data: UpdateMaterialData,
  ): Promise<typeof classMaterials.$inferSelect> => {
    const values: Partial<typeof classMaterials.$inferInsert> = { updatedAt: new Date() };
    if (data.title !== undefined) values.title = data.title;
    if (data.description !== undefined) values.description = data.description;
    if (data.mediaId !== undefined) values.mediaId = data.mediaId;
    if (data.courseId !== undefined) values.courseId = data.courseId;
    if (data.fileUrl !== undefined) values.fileUrl = data.fileUrl;

    const [row] = await db
      .update(classMaterials)
      .set(values)
      .where(eq(classMaterials.id, id))
      .returning();
    return row;
  },

  remove: async (id: string): Promise<void> => {
    await db.delete(classMaterials).where(eq(classMaterials.id, id));
  },

  findStudentCourseId: async (userId: string): Promise<string | null> => {
    const [row] = await db
      .select({ courseId: studentProfiles.courseId })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    return row?.courseId ?? null;
  },

  findEnrolledEmailsByCourse: async (courseId: string): Promise<string[]> => {
    const rows = await db
      .select({ email: users.email })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(studentProfiles.courseId, courseId));
    return rows.map((r) => r.email);
  },
};
