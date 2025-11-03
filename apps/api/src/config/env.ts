import { z } from 'zod';

/**
 * Environment Variable Schema
 * Validates all required and optional environment variables on startup
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).default('4000'),

  // CORS Configuration
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS must not be empty')
    .transform((val: string) => val.split(',').map((origin: string) => origin.trim())),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // CSRF Protection
  CSRF_SECRET: z
    .string()
    .min(32, 'CSRF_SECRET must be at least 32 characters')
    .optional()
    .default('default-csrf-secret-change-in-production'),

  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid database connection string')
    .optional(),

  // Rate Limiting (Redis)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required').optional(),

  // Email Service
  RESEND_TOKEN: z.string().min(1, 'RESEND_TOKEN is required').optional(),
  RESEND_EMAIL_FROM: z.string().email('RESEND_EMAIL_FROM must be a valid email').optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables on application startup
 * @throws {Error} If validation fails
 */
export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    console.log('✓ Environment variables validated successfully');
    return validated;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment variables. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * Parsed and validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();
