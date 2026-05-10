import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["dev", "demo", "production"]).default("demo"),
  APP_NAME: z.string().min(1).default("Mobeng CRM"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ERROR_TRACKING_PROVIDER: z.enum(["console", "sentry", "logtail", "datadog"]).default("console"),
  SENTRY_DSN: z.string().optional(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must contain at least 16 characters").default("mobeng-dev-secret-change-me"),
  INTEGRATION_API_KEY: z.string().min(16).default("mobeng-integration-dev-key"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL").optional(),
  NOTIFICATION_PROVIDER: z.enum(["mock", "whatsapp_cloud_api", "smtp", "resend"]).default("mock"),
  EMAIL_PROVIDER: z.enum(["mock", "smtp", "resend"]).default("mock"),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("halo@mobeng.co.id"),
  DEFAULT_NOTIFICATION_FROM_EMAIL: z.string().email().default("halo@mobeng.co.id"),
  DEFAULT_NOTIFICATION_FROM_NAME: z.string().min(1).default("Mobeng CRM"),
  JOB_RUNNER_MODE: z.enum(["memory", "database"]).default("database"),
  JOB_RUNNER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  FILE_STORAGE_PROVIDER: z.enum(["mock-local"]).default("mock-local"),
  UPLOAD_MAX_MB: z.coerce.number().positive().default(5),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  CRON_SECRET: z.string().min(8).default("mobeng-cron-secret-dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
  );
}

export const env = parsed.data;
