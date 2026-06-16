import { db } from '../../../db';
import { users, refreshTokens, studentProfiles, courses } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../utils/hash';
import { NotFoundError } from '../../../lib/errors';
import { mailService } from '../../mail/mail.service';
import { env } from '../../../config/env';

const stripPassword = <T extends { passwordHash?: string }>(user: T) => {
  const { passwordHash: _, ...rest } = user;
  return rest;
};

export const userAdminService = {
  verifyUser: async (id: string) => {
    const [user] = await db
      .update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'student') {
      const [profile] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, id));

      if (profile && !profile.initialVerification) {
        await db
          .update(studentProfiles)
          .set({ initialVerification: true, updatedAt: new Date() })
          .where(eq(studentProfiles.userId, id));

        let courseTitle: string | null = null;
        let planFeatures: string | null = null;
        if (profile.courseId) {
          const [course] = await db
            .select({
              title: courses.title,
              freeFeatures: courses.freeFeatures,
              halfFeatures: courses.halfFeatures,
              paidFeatures: courses.paidFeatures,
            })
            .from(courses)
            .where(eq(courses.id, profile.courseId));
          if (course) {
            courseTitle = course.title;
            planFeatures =
              profile.plan === 'paid'
                ? course.paidFeatures
                : profile.plan === 'half'
                  ? course.halfFeatures
                  : course.freeFeatures;
          }
        }

        mailService.sendAccountVerified(user.email, `${user.firstName} ${user.lastName}`, {
          plan: profile.plan,
          courseTitle,
          planFeatures,
          portalUrl: `${env.FRONTEND_URL}/login`,
        });
      }
    }

    return stripPassword(user);
  },

  blockUser: async (id: string, blocked: boolean) => {
    const [user] = await db
      .update(users)
      .set({ isBlocked: blocked, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new NotFoundError('User not found');
    if (blocked) {
      await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.userId, id));
    }
    return stripPassword(user);
  },

  unlockUser: async (id: string) => {
    const [user] = await db
      .update(users)
      .set({ loginLocked: false, failedLoginAttempts: 0, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new NotFoundError('User not found');
    return stripPassword(user);
  },

  resetPassword: async (id: string, newPassword: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError('User not found');

    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.userId, id));

    mailService.sendPasswordReset(
      user.email,
      `${user.firstName} ${user.lastName}`,
      newPassword,
    );

    return { message: 'Password reset successfully' };
  },
};
