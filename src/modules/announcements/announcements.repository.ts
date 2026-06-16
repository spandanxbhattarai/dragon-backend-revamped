import { db } from '../../db';
import {
  announcements,
  announcementResources,
  subscribers,
  media,
  users,
  studentProfiles,
} from '../../db/schema';
import { eq, ilike, desc, count, and, or, isNull } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';

type CreateData = {
  title: string;
  description: string;
  image?: string;
  mediaId?: string | null;
  privacy?: string;
  courseId?: string | null;
  resourceMediaIds?: string[];
};

type UpdateData = Partial<CreateData>;

const baseSelect = {
  id: announcements.id,
  title: announcements.title,
  image: announcements.image,
  mediaId: announcements.mediaId,
  description: announcements.description,
  privacy: announcements.privacy,
  courseId: announcements.courseId,
  createdAt: announcements.createdAt,
  updatedAt: announcements.updatedAt,
  mediaUrl: media.url,
  mediaFilename: media.filename,
  mediaMimeType: media.mimeType,
};

function shapeRow(row: any) {
  const { mediaUrl, mediaFilename, mediaMimeType, mediaId, ...rest } = row;
  return {
    ...rest,
    mediaId: mediaId ?? null,
    media: mediaId
      ? { id: mediaId, url: mediaUrl, filename: mediaFilename, mimeType: mediaMimeType }
      : null,
  };
}

export const announcementsRepository = {
  findAll: async (
    filters: { search?: string; privacy?: string; enrolledCourseId?: string },
    pagination: PaginationResult,
  ) => {
    const conditions = [];
    if (filters.search) conditions.push(ilike(announcements.title, `%${filters.search}%`));
    if (filters.privacy) conditions.push(eq(announcements.privacy, filters.privacy));
    if (filters.enrolledCourseId) {
      // Student-scoped view: public announcements plus announcements
      // targeted at their course (or untargeted "enrolled" broadcasts).
      const scoped = or(
        eq(announcements.privacy, 'public'),
        eq(announcements.courseId, filters.enrolledCourseId),
        and(eq(announcements.privacy, 'enrolled'), isNull(announcements.courseId)),
      );
      if (scoped) conditions.push(scoped);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select(baseSelect)
        .from(announcements)
        .leftJoin(media, eq(announcements.mediaId, media.id))
        .where(whereClause)
        .orderBy(desc(announcements.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(announcements).where(whereClause)
        : db.select({ total: count() }).from(announcements),
    ]);

    return { data: rows.map(shapeRow), total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(baseSelect)
      .from(announcements)
      .leftJoin(media, eq(announcements.mediaId, media.id))
      .where(eq(announcements.id, id))
      .limit(1);

    if (!row) return null;

    const shaped = shapeRow(row);

    const resources = await db
      .select({
        id: announcementResources.id,
        mediaId: announcementResources.mediaId,
        url: media.url,
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
      })
      .from(announcementResources)
      .innerJoin(media, eq(announcementResources.mediaId, media.id))
      .where(eq(announcementResources.announcementId, id));

    return { ...shaped, resources };
  },

  create: async (data: CreateData) => {
    return await db.transaction(async (tx) => {
      const [announcement] = await tx
        .insert(announcements)
        .values({
          title: data.title,
          description: data.description,
          image: data.image ?? null,
          mediaId: data.mediaId ?? null,
          privacy: data.privacy ?? 'public',
          courseId: data.courseId ?? null,
        })
        .returning();

      if (data.resourceMediaIds && data.resourceMediaIds.length > 0) {
        await tx.insert(announcementResources).values(
          data.resourceMediaIds.map((mid) => ({
            announcementId: announcement.id,
            mediaId: mid,
          })),
        );
      }

      return announcement;
    });
  },

  update: async (id: string, data: UpdateData) => {
    return await db.transaction(async (tx) => {
      const updateValues: Partial<typeof announcements.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (data.title !== undefined) updateValues.title = data.title;
      if (data.description !== undefined) updateValues.description = data.description;
      if (data.image !== undefined) updateValues.image = data.image;
      if (data.mediaId !== undefined) updateValues.mediaId = data.mediaId;
      if (data.privacy !== undefined) updateValues.privacy = data.privacy;
      if (data.courseId !== undefined) updateValues.courseId = data.courseId;

      const [updated] = await tx
        .update(announcements)
        .set(updateValues)
        .where(eq(announcements.id, id))
        .returning();

      if (data.resourceMediaIds !== undefined) {
        await tx
          .delete(announcementResources)
          .where(eq(announcementResources.announcementId, id));

        if (data.resourceMediaIds.length > 0) {
          await tx.insert(announcementResources).values(
            data.resourceMediaIds.map((mid) => ({
              announcementId: id,
              mediaId: mid,
            })),
          );
        }
      }

      return updated;
    });
  },

  remove: async (id: string) => {
    await db.delete(announcements).where(eq(announcements.id, id));
  },

  getSubscriberEmails: async (): Promise<string[]> => {
    const rows = await db.select({ email: subscribers.email }).from(subscribers);
    return rows.map((r) => r.email);
  },

  getAllUserEmails: async (): Promise<string[]> => {
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.isVerified, true));
    return rows.map((r) => r.email);
  },

  getEnrolledUserEmails: async (courseId: string): Promise<string[]> => {
    const rows = await db
      .select({ email: users.email })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(studentProfiles.courseId, courseId));
    return rows.map((r) => r.email);
  },

  findStudentCourseId: async (userId: string): Promise<string | null> => {
    const [row] = await db
      .select({ courseId: studentProfiles.courseId })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    return row?.courseId ?? null;
  },
};
