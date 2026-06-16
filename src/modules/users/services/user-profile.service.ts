import { db } from '../../../db';
import { users, studentProfiles, teacherProfiles, teacherCourses } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError, ForbiddenError } from '../../../lib/errors';

type EnrollmentInput = {
  courseId?: string | null;
  paymentImage?: string | null;
  citizenshipCertificate?: string | null;
};

export const userProfileService = {
  getProfile: async (id: string, requesterId: string, requesterRole: string) => {
    if (requesterRole !== 'admin' && requesterId !== id) throw new ForbiddenError();

    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'student') {
      const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, id));
      return profile ?? null;
    }

    if (user.role === 'teacher') {
      const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, id));
      if (!profile) return null;
      const courses = await db
        .select()
        .from(teacherCourses)
        .where(eq(teacherCourses.teacherProfileId, profile.id));
      return { ...profile, courses };
    }

    return null;
  },

  updateProfile: async (
    id: string,
    input: { bio?: string | null; specialization?: string | null },
    requesterId: string,
    requesterRole: string,
  ) => {
    if (requesterRole !== 'admin' && requesterId !== id) throw new ForbiddenError();

    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'teacher') {
      const profileFields: Record<string, unknown> = { updatedAt: new Date() };
      if (input.bio !== undefined) profileFields.bio = input.bio;
      if (input.specialization !== undefined) profileFields.specialization = input.specialization;
      const [updated] = await db
        .update(teacherProfiles)
        .set(profileFields as any)
        .where(eq(teacherProfiles.userId, id))
        .returning();
      return updated;
    }

    throw new ForbiddenError('Profile updates not allowed for this role');
  },

  updateEnrollment: async (
    id: string,
    input: EnrollmentInput,
    requesterId: string,
    requesterRole: string,
  ) => {
    if (requesterRole !== 'admin' && requesterId !== id) throw new ForbiddenError();

    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError('User not found');
    if (user.role !== 'student') throw new ForbiddenError('Only students have enrollment');

    const fields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.courseId !== undefined) fields.courseId = input.courseId;
    if (input.paymentImage !== undefined) fields.paymentImage = input.paymentImage;
    if (input.citizenshipCertificate !== undefined) fields.citizenshipCertificate = input.citizenshipCertificate;

    const [updated] = await db
      .update(studentProfiles)
      .set(fields as any)
      .where(eq(studentProfiles.userId, id))
      .returning();

    return updated;
  },
};
