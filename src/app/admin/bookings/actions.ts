"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function value(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function fail(message: string): never { redirect(`/admin/bookings?error=${encodeURIComponent(message)}`); }

export async function decideBooking(form: FormData) {
  await requireAdminMfa();
  const lineId = value(form, "lineId");
  const decision = value(form, "decision");
  const reason = value(form, "reason");
  if (!z.string().uuid().safeParse(lineId).success || !["approved", "rejected"].includes(decision) || reason.length < 5) fail("Choose a valid decision and record a reason.");
  let route: unknown = null;
  const routeText = value(form, "agreedRoute");
  if (routeText) { try { route = JSON.parse(routeText); } catch { fail("The owner-agreed route must be valid GeoJSON."); } }
  const { data, error } = await (await createServerSupabaseClient()).rpc("decide_booking_line", { target_line: lineId, decision, reason, agreed_route: route });
  if (error || !data) fail(error?.message ?? "The booking decision could not be recorded.");
  const outcome = data.status === "deadline_rejected" ? "The deadline had already passed. The line was rejected and a manual refund task was created." : `Booking ${data.status}.`;
  redirect(`/admin/bookings?message=${encodeURIComponent(outcome)}`);
}

export async function addBookingNote(form: FormData) {
  await requireAdminMfa();
  const lineId = value(form, "lineId");
  const note = value(form, "note");
  if (!z.string().uuid().safeParse(lineId).success || note.length < 2) fail("Enter a private coordination note.");
  const { error } = await (await createServerSupabaseClient()).rpc("add_booking_admin_note", { target_line: lineId, note_body: note });
  if (error) fail(error.message);
  redirect(`/admin/bookings?message=${encodeURIComponent("Private coordination note recorded. It was not sent to the owner or advertiser.")}`);
}
