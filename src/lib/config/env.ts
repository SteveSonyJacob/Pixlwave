import { z } from "zod";

const indiaRegion = z.literal("ap-south-1");

export const serverEnvSchema = z.object({
  APP_ENV: z.enum(["local", "test", "staging", "production"]),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((value) => !value.includes("change-me"), "must be configured"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).refine((value) => value !== "change-me", "must be configured"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).refine((value) => value !== "change-me", "must be configured"),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
  AUTH_EMAIL_METHOD: z.literal("password"),
  AUTH_SMTP_PROVIDER: z.string().min(2).refine((value) => value !== "change-me", "must be configured"),
  AUTH_SMS_PROVIDER: z.string().min(2).refine((value) => value !== "change-me", "must be configured"),
  AUTH_SESSION_IDLE_MINUTES: z.coerce.number().int().min(15).max(1440),
  AUTH_ADMIN_MFA_REQUIRED: z.string().transform((value) => value === "true").pipe(z.literal(true)),
  APP_COMPUTE_REGION: indiaRegion,
  DATABASE_REGION: indiaRegion,
  OBJECT_STORAGE_REGION: indiaRegion,
  BACKUP_REGION: indiaRegion,
  LOG_REGION: indiaRegion,
  MAPS_PRIMARY_PROVIDER: z.literal("mappls"),
  MAPS_FALLBACK_PROVIDER: z.literal("google"),
  OBJECT_STORAGE_PROVIDER: z.enum(["supabase", "s3"]),
  PAYMENT_PROVIDER: z.literal("razorpay"),
  DATABASE_ALLOW_TEST_AUTH_STUBS: z.string().optional().default("false").transform((value) => value === "true")
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvSource = Record<string, string | undefined>;

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid Pixlwave configuration:\n${fields.join("\n")}`);
  }
  return parsed.data;
}

export function inspectServerEnv(source: EnvSource = process.env) {
  const parsed = serverEnvSchema.safeParse(source);
  return parsed.success
    ? { valid: true as const, environment: parsed.data.APP_ENV, regions: {
        compute: parsed.data.APP_COMPUTE_REGION,
        database: parsed.data.DATABASE_REGION,
        storage: parsed.data.OBJECT_STORAGE_REGION,
        backups: parsed.data.BACKUP_REGION,
        logs: parsed.data.LOG_REGION
      } }
    : { valid: false as const, errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      })) };
}

export function readPublicSupabaseEnv(source: EnvSource = process.env) {
  const schema = serverEnvSchema.pick({
    NEXT_PUBLIC_SUPABASE_URL: true,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true
  });
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new Error("Supabase public configuration is missing or invalid. Check .env.local or .env.");
  }
  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  };
}
