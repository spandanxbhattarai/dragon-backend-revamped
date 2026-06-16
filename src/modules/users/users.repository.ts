import { db } from '../../db';
import { users, teacherProfiles, teacherCourses, courses } from '../../db/schema';
import { eq, and, ilike, desc, count, SQL } from 'drizzle-orm';

interface UserFilters {
  role?: string;
  search?: string;
}

interface Pagination {
  offset: number;
  limit: number;
}

export const usersRepository = {
  findAll: async (filters: UserFilters, pagination: Pagination) => {
    const conditions: SQL[] = [];
    if (filters.role) conditions.push(eq(users.role, filters.role as any));
    if (filters.search) {
      conditions.push(
        ilike(users.firstName, `%${filters.search}%`),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).offset(pagination.offset).limit(pagination.limit),
      db.select({ count: count() }).from(users).where(whereClause),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  },

  findById: async (id: string) => {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result ?? null;
  },

  findByEmail: async (email: string) => {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result ?? null;
  },

  findByPhone: async (phone: string) => {
    const [result] = await db.select().from(users).where(eq(users.phone, phone));
    return result ?? null;
  },

  update: async (id: string, data: Partial<typeof users.$inferInsert>) => {
    const [result] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result ?? null;
  },

  countAll: async () => {
    const [result] = await db.select({ count: count() }).from(users);
    return result?.count ?? 0;
  },

  findTeachersForAbout: async () => {
    const profiles = await db
      .select({
        id: teacherProfiles.id,
        userId: teacherProfiles.userId,
        bio: teacherProfiles.bio,
        specialization: teacherProfiles.specialization,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      })
      .from(teacherProfiles)
      .innerJoin(users, eq(teacherProfiles.userId, users.id))
      .where(eq(teacherProfiles.enableDisplayInAbout, true));

    if (!profiles.length) return [];

    const withCourses = await Promise.all(
      profiles.map(async (p) => {
        const teacherCourseRows = await db
          .select({ courseId: teacherCourses.courseId, title: courses.title })
          .from(teacherCourses)
          .innerJoin(courses, eq(teacherCourses.courseId, courses.id))
          .where(eq(teacherCourses.teacherProfileId, p.id));
        return { ...p, courses: teacherCourseRows };
      }),
    );

    return withCourses;
  },
};
