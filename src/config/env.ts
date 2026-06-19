import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PHONE: z.string().min(10),
  ADMIN_PASSWORD: z.string().min(6),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  GMAIL_USER: z.string().email(),
  GMAIL_APP_PASSWORD: z.string().min(1),
  EMAIL_FROM_NAME: z.string().default('Dragon Education Foundation'),
  EMAIL_FROM_ADDRESS: z.string().email(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
