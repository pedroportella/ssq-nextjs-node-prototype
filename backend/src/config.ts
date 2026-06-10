import { z } from "zod";

const booleanString = z.preprocess((value) => {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}, z.boolean());

const commaSeparatedList = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}, z.array(z.string().url()));

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(7001),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  APP_NAME: z.string().min(1).default("ssq-node-api"),
  APP_VERSION: z.string().min(1).default("0.0.0"),
  DEBUG_ROUTES_ENABLED: booleanString.default(false),
  CORS_ALLOWED_ORIGINS: commaSeparatedList.default([]),
  RATE_LIMIT_ENABLED: booleanString.default(true),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  DATABASE_URL: z.string().url().optional()
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse(env);
}
