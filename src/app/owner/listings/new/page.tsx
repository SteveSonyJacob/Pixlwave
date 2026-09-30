import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadListingDraft } from "@/lib/inventory/draft-loader";

type PageProps = { searchParams: Promise<{ error?: string; draft?: string }> };
export default async function NewListingPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const { data } = await (await createServerSupabaseClient()).from("owner_verifications").select("status").eq("owner_id", identity.userId).maybeSingle();
  if (data?.status !== "approved") redirect("/owner?error=Approved+owner+verification+is+required");
  const draft = await loadListingDraft(identity.userId, undefined, query.draft);
  return <main className="dashboard-shell listing-builder"><div className="dashboard-heading"><div><span className="eyebrow">My inventory</span><h1>Add a new screen</h1><p>Tell us about your screen, set your service details and save a draft for review.</p></div><Link className="button button-secondary button-small" href="/owner">Back to inventory</Link></div><MessageBanner error={query.error} /><ListingForm key={draft?.id ?? "new"} draft={draft} /></main>;
}
