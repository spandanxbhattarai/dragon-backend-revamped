import { db } from '../../db';
import {
  users,
  studentProfiles,
  refreshTokens,
  courses,
} from '../../db/schema';
import { and, eq } from 'drizzle-orm';

type NewUser = typeof users.$inferInsert;
type NewStudentProfile = typeof studentProfiles.$inferInsert;
type NewRefreshToken = typeof refreshTokens.$inferInsert;

export const authRepository = {
  findUserByEmail: async (email: string) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ?? null;
  },

  findUserByPhone: async (phone: string) => {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user ?? null;
  },

  findUserById: async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  },

  // Lightweight per-request auth check — just the fields needed to decide
  // whether the bearer is still allowed in.
  getUserAuthState: async (id: string) => {
    const [row] = await db
      .select({ id: users.id, isBlocked: users.isBlocked })
      .from(users)
      .where(eq(users.id, id));
    return row ?? null;
  },

  createUser: async (values: NewUser) => {
    const [user] = await db.insert(users).values(values).returning();
    return user;
  },

  createStudentProfile: async (values: NewStudentProfile) => {
    const [profile] = await db.insert(studentProfiles).values(values).returning();
    return profile;
  },

  findCourseTitleById: async (courseId: string): Promise<string | null> => {
    const [row] = await db
      .select({ title: courses.title })
      .from(courses)
      .where(eq(courses.id, courseId));
    return row?.title ?? null;
  },

  recordFailedLogin: async (userId: string, attempts: number, locked: boolean) => {
    await db
      .update(users)
      .set({ failedLoginAttempts: attempts, loginLocked: locked, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },

  recordSuccessfulLogin: async (userId: string) => {
    const now = new Date();
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lastLoginAt: now, updatedAt: now })
      .where(eq(users.id, userId));
  },

  insertRefreshToken: async (values: NewRefreshToken) => {
    await db.insert(refreshTokens).values(values);
  },

  findActiveRefreshTokenWithUser: async (hashedToken: string) => {
    const [row] = await db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        expiresAt: refreshTokens.expiresAt,
        role: users.role,
        isBlocked: users.isBlocked,
      })
      .from(refreshTokens)
      .innerJoin(users, eq(refreshTokens.userId, users.id))
      .where(and(eq(refreshTokens.token, hashedToken), eq(refreshTokens.isRevoked, false)));
    return row ?? null;
  },

  revokeRefreshTokenById: async (id: string) => {
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.id, id));
  },

  revokeRefreshTokenByToken: async (hashedToken: string) => {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.token, hashedToken));
  },

  revokeAllRefreshTokensForUser: async (userId: string) => {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  },
};
