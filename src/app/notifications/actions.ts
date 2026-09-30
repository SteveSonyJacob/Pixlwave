"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notificationPageHref, parseNotificationFilters } from "@/lib/operations/list-filters";

export async function markNotificationRead(form: FormData) {
  await requireIdentity();
  const filters = parseNotificationFilters({ view: String(form.get("view") ?? ""), channel: String(form.get("channel") ?? ""), page: String(form.get("page") ?? "") });
  const returnTo = notificationPageHref(filters, filters.page);
  const id = z.string().uuid().safeParse(form.get("notificationId"));
  if (!id.success) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=Invalid%20notification.`);
  const { error } = await (await createServerSupabaseClient()).rpc("mark_notification_read", { target_notification: id.data });
  if (error) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Notification could not be marked read.")}`);
  redirect(returnTo);
}
