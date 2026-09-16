import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Environment schema. Secrets that are dangerous to default in production are
 * required there; in development we allow safe fallbacks so the API boots
 * out-of-the-box. Third-party integrations (Paystack/Cloudinary/Resend) are
 * optional — the related feature degrades gracefully and logs a warning.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  PAYSTACK_SECRET_KEY: z.string().optional().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default(''),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('BufaHairs <noreply@bufahairs.test>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

// Guard against booting production with dev-default secrets.
if (isProd) {
  const weak = ['dev_access_secret_change_me', 'dev_refresh_secret_change_me', ''];
  if (weak.includes(raw.JWT_ACCESS_SECRET) || weak.includes(raw.JWT_REFRESH_SECRET)) {
    // eslint-disable-next-line no-console
    console.error('❌ Refusing to start in production with default/empty JWT secrets.');
    process.exit(1);
  }
}

export const env = {
  ...raw,
  isProd,
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  paystackEnabled: Boolean(raw.PAYSTACK_SECRET_KEY),
  cloudinaryEnabled: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  ),
  emailEnabled: Boolean(raw.RESEND_API_KEY),
};

export type Env = typeof env;
