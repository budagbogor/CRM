import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["dev", "demo", "production"]).default("demo"),
  APP_NAME: z.string().min(1).default("Mobeng CRM"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must contain at least 16 characters").default("mobeng-dev-secret-change-me"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NOTIFICATION_PROVIDER_WHATSAPP: z.enum(["mock"]).default("mock"),
  NOTIFICATION_PROVIDER_EMAIL: z.enum(["mock"]).default("mock"),
  NOTIFICATION_PROVIDER_SMS: z.enum(["mock"]).default("mock"),
  DEFAULT_NOTIFICATION_FROM_EMAIL: z.string().email().default("halo@mobeng.co.id"),
  DEFAULT_NOTIFICATION_FROM_NAME: z.string().min(1).default("Mobeng CRM"),
  JOB_RUNNER_MODE: z.enum(["memory", "database"]).default("database"),
  JOB_RUNNER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  FILE_STORAGE_PROVIDER: z.enum(["mock-local"]).default("mock-local"),
  UPLOAD_MAX_MB: z.coerce.number().positive().default(5),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
  );
}

export const env = parsed.data;
