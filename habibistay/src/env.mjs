// @ts-check
import { z } from 'zod';

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid environment variables.
 */
const server = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().url(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  
  // Payment Providers
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MYFATOORAH_API_KEY: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  
  // External Services
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Email Service
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Redis (for caching and sessions)
  REDIS_URL: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).optional().default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).optional().default('900000'),
  
  // Security
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32).optional(),
  
  // Feature Flags
  ENABLE_CHANNEL_MANAGER: z.string().transform(val => val === 'true').optional().default('false'),
  ENABLE_VOICE_CONTROL: z.string().transform(val => val === 'true').optional().default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional().default('false'),
  ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').optional().default('false'),
  
  // Monitoring and Logging
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  
  // Performance
  ENABLE_COMPRESSION: z.string().transform(val => val === 'true').optional().default('true'),
  ENABLE_CACHE: z.string().transform(val => val === 'true').optional().default('true'),
  
  // API Configuration
  API_RATE_LIMIT: z.string().transform(val => parseInt(val, 10)).optional().default('1000'),
  API_TIMEOUT: z.string().transform(val => parseInt(val, 10)).optional().default('30000'),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 */
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  
  // Payment Providers
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  MYFATOORAH_API_KEY: process.env.MYFATOORAH_API_KEY,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  
  // External Services
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Email Service
  EMAIL_SERVER: process.env.EMAIL_SERVER,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL,
  
  // Rate Limiting
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  
  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Feature Flags
  ENABLE_CHANNEL_MANAGER: process.env.ENABLE_CHANNEL_MANAGER,
  ENABLE_VOICE_CONTROL: process.env.ENABLE_VOICE_CONTROL,
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
  ENABLE_DEBUG_MODE: process.env.ENABLE_DEBUG_MODE,
  
  // Monitoring and Logging
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL,
  
  // Performance
  ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION,
  ENABLE_CACHE: process.env.ENABLE_CACHE,
  
  // API Configuration
  API_RATE_LIMIT: process.env.API_RATE_LIMIT,
  API_TIMEOUT: process.env.API_TIMEOUT,
};

// Don't touch the part below
// ------------------------------

const merged = server.safeParse(processEnv);

if (!merged.success) {
  console.error(
    '❌ Invalid environment variables:',
    merged.error.issues
      .map((issue) => `\n  - ${issue.path.join('.')}: ${issue.message}`)
      .join('')
  );
  throw new Error('❌ Invalid environment variables');
}

// This will throw if the environment variables are invalid
const env = merged.data;

// We also export a client-side safe version of the env vars
export const clientEnv = {
  // Public env vars that are exposed to the client
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE,
};

export default env;
