import { db } from '../../db';
import { events, eventResources, subscribers, media, studentProfiles } from '../../db/schema';
import { eq, and, or, ilike, desc, count, isNull, SQL } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';

type CreateData = {
  title: string;
  description: string;
  category?: string;
  eventDate: Date;
  address?: string;
  privacy?: string;
  courseId?: string | null;
  image?: string;
  mediaId?: string | null;
  resourceMediaIds?: string[];
};

type UpdateData = Partial<CreateData>;

const baseSelect = {
  id: events.id,
  title: events.title,
  description: events.description,
  category: events.category,
  eventDate: events.eventDate,
  address: events.address,
  privacy: events.privacy,
  courseId: events.courseId,
  image: events.image,
  mediaId: events.mediaId,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
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

export const eventsRepository = {
  findAll: async (
    filters: {
      privacy?: string;
      search?: string;
      enrolledCourseId?: string;
    },
    pagination: PaginationResult,
  ) => {
    const conditions: SQL[] = [];

    if (filters.privacy) {
      conditions.push(eq(events.privacy, filters.privacy));
    }
    if (filters.search) {
      conditions.push(ilike(events.title, `%${filters.search}%`));
    }
    if (filters.enrolledCourseId) {
      // Student-scoped view: public events plus events targeted at their
      // course (either explicitly via courseId or via privacy='enrolled'
      // with no specific course).
      const scoped = or(
        eq(events.privacy, 'public'),
        eq(events.courseId, filters.enrolledCourseId),
        and(eq(events.privacy, 'enrolled'), isNull(events.courseId)),
      );
      if (scoped) conditions.push(scoped);
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...(conditions as [SQL, SQL, ...SQL[]]));

    const [rows, countRows] = await Promise.all([
      db
        .select(baseSelect)
        .from(events)
        .leftJoin(media, eq(events.mediaId, media.id))
        .where(whereClause)
        .orderBy(desc(events.eventDate))
        .limit(pagination.limit)
        .offset(pagination.offset),
      whereClause
        ? db.select({ total: count() }).from(events).where(whereClause)
        : db.select({ total: count() }).from(events),
    ]);

    return { data: rows.map(shapeRow), total: countRows[0]?.total ?? 0 };
  },

  findById: async (id: string) => {
    const [row] = await db
      .select(baseSelect)
      .from(events)
      .leftJoin(media, eq(events.mediaId, media.id))
      .where(eq(events.id, id))
      .limit(1);

    if (!row) return null;

    const shaped = shapeRow(row);

    const resources = await db
      .select({
        id: eventResources.id,
        mediaId: eventResources.mediaId,
        url: media.url,
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
      })
      .from(eventResources)
      .innerJoin(media, eq(eventResources.mediaId, media.id))
      .where(eq(eventResources.eventId, id));

    return { ...shaped, resources };
  },

  create: async (data: CreateData) => {
    return await db.transaction(async (tx) => {
      const [event] = await tx
        .insert(events)
        .values({
          title: data.title,
          description: data.description,
          category: data.category ?? 'Other',
          eventDate: data.eventDate,
          address: data.address ?? null,
          privacy: data.privacy ?? 'public',
          courseId: data.courseId ?? null,
          image: data.image ?? null,
          mediaId: data.mediaId ?? null,
        })
        .returning();

      if (data.resourceMediaIds && data.resourceMediaIds.length > 0) {
        await tx.insert(eventResources).values(
          data.resourceMediaIds.map((mid) => ({
            eventId: event.id,
            mediaId: mid,
          })),
        );
      }

      return event;
    });
  },

  update: async (id: string, data: UpdateData) => {
    return await db.transaction(async (tx) => {
      const updateValues: Partial<typeof events.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (data.title !== undefined) updateValues.title = data.title;
      if (data.description !== undefined) updateValues.description = data.description;
      if (data.category !== undefined) updateValues.category = data.category;
      if (data.eventDate !== undefined) updateValues.eventDate = data.eventDate;
      if (data.address !== undefined) updateValues.address = data.address;
      if (data.privacy !== undefined) updateValues.privacy = data.privacy;
      if (data.courseId !== undefined) updateValues.courseId = data.courseId;
      if (data.image !== undefined) updateValues.image = data.image;
      if (data.mediaId !== undefined) updateValues.mediaId = data.mediaId;

      const [updated] = await tx
        .update(events)
        .set(updateValues)
        .where(eq(events.id, id))
        .returning();

      if (data.resourceMediaIds !== undefined) {
        await tx.delete(eventResources).where(eq(eventResources.eventId, id));

        if (data.resourceMediaIds.length > 0) {
          await tx.insert(eventResources).values(
            data.resourceMediaIds.map((mid) => ({
              eventId: id,
              mediaId: mid,
            })),
          );
        }
      }

      return updated;
    });
  },

  remove: async (id: string) => {
    await db.delete(events).where(eq(events.id, id));
  },

  getSubscriberEmails: async (): Promise<string[]> => {
    const rows = await db.select({ email: subscribers.email }).from(subscribers);
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
