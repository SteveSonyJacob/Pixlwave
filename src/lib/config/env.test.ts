import { describe, expect, it } from "vitest";
import { inspectServerEnv, readServerEnv } from "./env";

const valid = {
  APP_ENV: "test", NEXT_PUBLIC_APP_URL: "http://localhost:3000", NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1234567890", SUPABASE_SERVICE_ROLE_KEY: "service_role_1234567890",
  DATABASE_URL: "postgresql://localhost/pixlwave_test", LOG_LEVEL: "info", AUTH_EMAIL_METHOD: "password",
  AUTH_SMTP_PROVIDER: "smtp-test", AUTH_SMS_PROVIDER: "sms-test", AUTH_SESSION_IDLE_MINUTES: "60", AUTH_ADMIN_MFA_REQUIRED: "true",
  APP_COMPUTE_REGION: "ap-south-1", DATABASE_REGION: "ap-south-1", OBJECT_STORAGE_REGION: "ap-south-1", BACKUP_REGION: "ap-south-1", LOG_REGION: "ap-south-1",
  MAPS_PRIMARY_PROVIDER: "mappls", MAPS_FALLBACK_PROVIDER: "google", OBJECT_STORAGE_PROVIDER: "supabase", PAYMENT_PROVIDER: "razorpay"
};

describe("configuration boundary", () => {
  it("accepts the documented India-hosted provider plan", () => expect(readServerEnv(valid).APP_ENV).toBe("test"));
  it("fails clearly for missing values and non-India main data", () => {
    const result = inspectServerEnv({ ...valid, DATABASE_REGION: "eu-west-1", AUTH_SMS_PROVIDER: "change-me" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.map((item) => item.field)).toEqual(expect.arrayContaining(["DATABASE_REGION", "AUTH_SMS_PROVIDER"]));
  });
});
