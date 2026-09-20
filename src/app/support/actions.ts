"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireIdentity, requireAdminMfa } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({ subject: z.string().trim().min(5).max(160), message: z.string().trim().min(2).max(5000), listingId: z.string().uuid().or(z.literal("")), bookingReference: z.string().trim().max(120) });
const replySchema = z.object({ ticketId: z.string().uuid(), message: z.string().trim().min(2).max(5000) });

function supportError(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`); }

export async function createSupportTicket(form: FormData) {
  await requireIdentity();
  const parsed = createSchema.safeParse({ subject: form.get("subject"), message: form.get("message"), listingId: form.get("listingId") ?? "", bookingReference: form.get("bookingReference") ?? "" });
  if (!parsed.success) supportError("/support", parsed.error.issues[0]?.message ?? "Check the ticket details.");
  const { data, error } = await (await createServerSupabaseClient()).rpc("create_support_ticket", { input: parsed.data });
  if (error || !data) supportError("/support", error?.message ?? "Ticket could not be created.");
  redirect(`/support/${data.id}?message=${encodeURIComponent("Support ticket created.")}`);
}

export async function replySupportTicket(form: FormData) {
  await requireIdentity();
  const parsed = replySchema.safeParse({ ticketId: form.get("ticketId"), message: form.get("message") });
  if (!parsed.success) supportError("/support", "Reply must contain at least two characters.");
  const { error } = await (await createServerSupabaseClient()).rpc("reply_support_ticket", { target_ticket: parsed.data.ticketId, message_body: parsed.data.message, internal_note: false });
  if (error) supportError(`/support/${parsed.data.ticketId}`, error.message);
  redirect(`/support/${parsed.data.ticketId}?message=${encodeURIComponent("Reply added.")}`);
}

export async function addInternalNote(form: FormData) {
  await requireAdminMfa();
  const parsed = replySchema.safeParse({ ticketId: form.get("ticketId"), message: form.get("message") });
  if (!parsed.success) supportError("/admin/support", "Internal note must contain at least two characters.");
  const { error } = await (await createServerSupabaseClient()).rpc("reply_support_ticket", { target_ticket: parsed.data.ticketId, message_body: parsed.data.message, internal_note: true });
  if (error) supportError(`/admin/support/${parsed.data.ticketId}`, error.message);
  redirect(`/admin/support/${parsed.data.ticketId}?message=${encodeURIComponent("Private note added.")}`);
}

export async function adminReplySupportTicket(form: FormData) {
  await requireAdminMfa();
  const parsed = replySchema.safeParse({ ticketId: form.get("ticketId"), message: form.get("message") });
  if (!parsed.success) supportError("/admin/support", "Reply must contain at least two characters.");
  const { error } = await (await createServerSupabaseClient()).rpc("reply_support_ticket", { target_ticket: parsed.data.ticketId, message_body: parsed.data.message, internal_note: false });
  if (error) supportError(`/admin/support/${parsed.data.ticketId}`, error.message);
  redirect(`/admin/support/${parsed.data.ticketId}?message=${encodeURIComponent("Customer reply added.")}`);
}

export async function setSupportTicketStatus(form: FormData) {
  await requireAdminMfa();
  const ticketId = z.string().uuid().parse(form.get("ticketId"));
  const status = z.enum(["open", "in_progress", "resolved", "closed"]).parse(form.get("status"));
  const { error } = await (await createServerSupabaseClient()).rpc("set_support_ticket_status", { target_ticket: ticketId, next_status: status });
  if (error) supportError(`/admin/support/${ticketId}`, error.message);
  redirect(`/admin/support/${ticketId}?message=${encodeURIComponent("Ticket status updated.")}`);
}
