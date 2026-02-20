/**
 * Environment variables validation using Zod
 * Validates at startup to catch missing config early
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),
  VITE_SUPABASE_PROJECT_ID: z.string().min(1, 'VITE_SUPABASE_PROJECT_ID is required'),
  
  // Optional env vars
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('warn'),
  
  // Build mode
  MODE: z.string().optional(),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validate and return typed environment variables.
 * Throws at startup if required vars are missing.
 */
export function getEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
    VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  if (!result.success) {
    const parseError = result as z.SafeParseError<Env>;
    const errors = parseError.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    
    console.error(`❌ Environment validation failed:\n${errors}`);
    
    // In dev, warn but don't crash
    if (import.meta.env.DEV) {
      console.warn('Continuing with partial env in dev mode...');
      validatedEnv = envSchema.parse({
        ...Object.fromEntries(
          Object.entries(import.meta.env).filter(([k]) => k.startsWith('VITE_'))
        ),
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
      });
      return validatedEnv;
    }
    
    throw new Error(`Missing or invalid environment variables:\n${errors}`);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

// Validate on import (fail fast)
export const env = getEnv();
