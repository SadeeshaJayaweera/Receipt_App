const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config(); // fallback to local cwd .env

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

function loadConfig(overrides = {}) {
  const currentEnv = overrides.NODE_ENV || process.env.NODE_ENV || 'development';

  const raw = {
    NODE_ENV: currentEnv,
    PORT: overrides.PORT ?? process.env.PORT,
    MONGODB_URI: overrides.MONGODB_URI ?? (
      currentEnv === 'test'
        ? 'mongodb://localhost:27017/juice-receipt-app-test'
        : (process.env.MONGODB_URI || '')
    ),
    JWT_SECRET: overrides.JWT_SECRET ?? (
      currentEnv === 'test'
        ? 'test-jwt-secret-key-for-testing-only'
        : (process.env.JWT_SECRET || '')
    ),
    JWT_EXPIRES_IN: overrides.JWT_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? '7d',
    FRONTEND_URL: overrides.FRONTEND_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: overrides.RATE_LIMIT_WINDOW_MS ?? process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: overrides.RATE_LIMIT_MAX ?? process.env.RATE_LIMIT_MAX,
  };

  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(
      issue => `  - ${issue.path.join('.')}: ${issue.message}`
    ).join('\n');

    const message = `[FATAL] Invalid environment configuration:\n${errorDetails}`;
    if (currentEnv === 'production') {
      console.error(message);
      throw new Error(message);
    } else if (currentEnv === 'test' && !overrides._throwOnly) {
      // Return safe defaults for tests if not explicitly testing validation errors
      return {
        NODE_ENV: 'test',
        PORT: 5001,
        MONGODB_URI: 'mongodb://localhost:27017/juice-receipt-app-test',
        JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
        JWT_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:3000',
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX: 100,
      };
    } else {
      throw new Error(message);
    }
  }

  return parsed.data;
}

const config = loadConfig();

module.exports = {
  config,
  loadConfig,
  envSchema
};
