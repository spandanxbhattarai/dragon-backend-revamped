import { db } from '../../../db';
import { users, studentProfiles, teacherProfiles, teacherCourses, courses } from '../../../db/schema';
import { eq, ilike, or, and, count, desc, SQL } from 'drizzle-orm';
import { hashPassword } from '../../../utils/hash';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/errors';
import { mailService } from '../../mail/mail.service';
import { env } from '../../../config/env';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../users.schema';

const stripPassword = <T extends { passwordHash?: string }>(user: T) => {
  const { passwordHash: _, ...rest } = user;
  return rest;
};

export const userCrudService = {
  listUsers: async (query: ListUsersQuery) => {
    const { page, limit, role, search, isVerified } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (role) conditions.push(eq(users.role, role as any));
    if (isVerified !== undefined) conditions.push(eq(users.isVerified, isVerified));
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          image: users.image,
          isVerified: users.isVerified,
          isBlocked: users.isBlocked,
          loginLocked: users.loginLocked,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ]);

    return {
      data,
      meta: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
    };
  },

  getUserById: async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw new NotFoundError('User not found');
    return stripPassword(user);
  },

  createUser: async (input: CreateUserInput) => {
    const [dupEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
    if (dupEmail) throw new ConflictError('Email already exists');

    const [dupPhone] = await db.select({ id: users.id }).from(users).where(eq(users.phone, input.phone));
    if (dupPhone) throw new ConflictError('Phone number already exists');

    if (input.role === 'student') {
      if (!input.citizenshipCertificate) {
        throw new BadRequestError('Citizenship certificate is required');
      }
      if (input.plan && input.plan !== 'free' && !input.paymentImage) {
        throw new BadRequestError('Payment image is required for paid plans');
      }
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        image: input.image ?? null,
        isVerified: input.isVerified ?? (input.role === 'teacher'),
      })
      .returning();

    if (input.role === 'student') {
      const plan = input.plan ?? 'free';
      const courseId = input.courseId ?? null;
      const initialVerification = user.isVerified;
      await db.insert(studentProfiles).values({
        userId: user.id,
        plan,
        courseId,
        paymentImage: input.paymentImage ?? null,
        citizenshipCertificate: input.citizenshipCertificate ?? null,
        initialVerification,
      });

      // Admin can mark students verified at creation. That bypasses the
      // explicit verify step, so we send the "account active" mail here
      // instead. initialVerification above ensures a later unverify/
      // verify cycle stays silent.
      if (user.isVerified) {
        let courseTitle: string | null = null;
        let planFeatures: string | null = null;
        if (courseId) {
          const [course] = await db
            .select({
              title: courses.title,
              freeFeatures: courses.freeFeatures,
              halfFeatures: courses.halfFeatures,
              paidFeatures: courses.paidFeatures,
            })
            .from(courses)
            .where(eq(courses.id, courseId));
          if (course) {
            courseTitle = course.title;
            planFeatures =
              plan === 'paid'
                ? course.paidFeatures
                : plan === 'half'
                  ? course.halfFeatures
                  : course.freeFeatures;
          }
        }
        mailService.sendAccountVerified(user.email, `${user.firstName} ${user.lastName}`, {
          plan,
          courseTitle,
          planFeatures,
          portalUrl: `${env.FRONTEND_URL}/login`,
        });
      }
    } else if (input.role === 'teacher') {
      const [profile] = await db
        .insert(teacherProfiles)
        .values({
          userId: user.id,
          bio: input.bio ?? null,
          specialization: input.specialization ?? null,
          enableDisplayInAbout: input.enableDisplayInAbout ?? false,
        })
        .returning();

      if (input.courseIds?.length) {
        await db.insert(teacherCourses).values(
          input.courseIds.map((cid) => ({ teacherProfileId: profile.id, courseId: cid })),
        );
      }
    }

    return stripPassword(user);
  },

  updateUser: async (id: string, input: UpdateUserInput) => {
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) throw new NotFoundError('User not found');

    if (input.email && input.email !== existing.email) {
      const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
      if (dup) throw new ConflictError('Email already in use');
    }
    if (input.phone && input.phone !== existing.phone) {
      const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.phone, input.phone));
      if (dup) throw new ConflictError('Phone number already in use');
    }

    const userFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of ['firstName', 'lastName', 'email', 'phone', 'image', 'isVerified', 'isBlocked', 'loginLocked'] as const) {
      if (input[field] !== undefined) userFields[field] = input[field];
    }

    const [updated] = await db.update(users).set(userFields as any).where(eq(users.id, id)).returning();

    // Update corresponding profile
    if (existing.role === 'student') {
      const profileFields: Record<string, unknown> = { updatedAt: new Date() };
      for (const field of ['plan', 'courseId', 'paymentImage', 'citizenshipCertificate'] as const) {
        if (input[field] !== undefined) profileFields[field] = input[field];
      }
      if (Object.keys(profileFields).length > 1) {
        await db.update(studentProfiles).set(profileFields as any).where(eq(studentProfiles.userId, id));
      }
    } else if (existing.role === 'teacher') {
      const profileFields: Record<string, unknown> = { updatedAt: new Date() };
      if (input.bio !== undefined) profileFields.bio = input.bio;
      if (input.specialization !== undefined) profileFields.specialization = input.specialization;
      if (input.enableDisplayInAbout !== undefined) profileFields.enableDisplayInAbout = input.enableDisplayInAbout;
      if (Object.keys(profileFields).length > 1) {
        const [prof] = await db
          .update(teacherProfiles)
          .set(profileFields as any)
          .where(eq(teacherProfiles.userId, id))
          .returning();
        if (prof && input.courseIds !== undefined) {
          await db.delete(teacherCourses).where(eq(teacherCourses.teacherProfileId, prof.id));
          if (input.courseIds.length) {
            await db.insert(teacherCourses).values(
              input.courseIds.map((cid) => ({ teacherProfileId: prof.id, courseId: cid })),
            );
          }
        }
      }
    }

    return stripPassword(updated);
  },
};
