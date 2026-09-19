"use server";
import { redirect } from "next/navigation";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markNotificationRead(form: FormData) {
  await requireIdentity();
  const id = String(form.get("notificationId") ?? "");
  await (await createServerSupabaseClient()).rpc("mark_notification_read", { target_notification: id });
  redirect("/notifications");
}
