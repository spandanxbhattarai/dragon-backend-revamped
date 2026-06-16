import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: z.enum(['student', 'teacher', 'admin']).optional(),
    search: z.string().optional(),
    isVerified: z.preprocess(
      (v) => (v === 'true' ? true : v === 'false' ? false : undefined),
      z.boolean().optional(),
    ),
  }),
});

const studentProfileFields = z.object({
  plan: z.enum(['free', 'half', 'paid']).optional(),
  courseId: z.string().uuid().optional().nullable(),
  paymentImage: z.string().optional().nullable(),
  citizenshipCertificate: z.string().optional().nullable(),
});

const teacherProfileFields = z.object({
  bio: z.string().optional().nullable(),
  specialization: z.string().max(200).optional().nullable(),
  enableDisplayInAbout: z.boolean().optional(),
  courseIds: z.array(z.string().uuid()).optional(),
});

export const createUserSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(100),
      lastName: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().min(10).max(30),
      password: z.string().min(6),
      role: z.enum(['student', 'teacher']),
      isVerified: z.boolean().optional(),
      image: z.string().optional().nullable(),
    })
    .merge(studentProfileFields)
    .merge(teacherProfileFields),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(100).optional(),
      lastName: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(10).max(30).optional(),
      image: z.string().optional().nullable(),
      isVerified: z.boolean().optional(),
      isBlocked: z.boolean().optional(),
      loginLocked: z.boolean().optional(),
    })
    .merge(studentProfileFields)
    .merge(teacherProfileFields),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const blockUserSchema = z.object({
  body: z.object({
    blocked: z.boolean(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().optional().nullable(),
    specialization: z.string().max(200).optional().nullable(),
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type BlockUserInput = z.infer<typeof blockUserSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
