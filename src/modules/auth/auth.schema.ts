import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(30),
    password: z.string().min(6),
    courseId: z.string().uuid().optional(),
    plan: z.enum(['free', 'half', 'paid']).default('free'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
