import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { MessageBanner } from "@/components/message-banner";
import { requireIdentity } from "@/lib/auth/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ error?: string }> };
export default async function NewListingPage({ searchParams }: PageProps) {
  const [identity, query] = await Promise.all([requireIdentity(), searchParams]);
  const { data } = await (await createServerSupabaseClient()).from("owner_verifications").select("status").eq("owner_id", identity.userId).maybeSingle();
  if (data?.status !== "approved") redirect("/owner?error=Approved+owner+verification+is+required");
  return <main className="dashboard-shell listing-builder"><div className="dashboard-heading"><div><span className="eyebrow">New inventory</span><h1>Describe the service precisely</h1><p>These fields become the admin-approved service contract. Paid bookings later copy an immutable snapshot.</p></div><Link className="button button-secondary button-small" href="/owner">Back to inventory</Link></div><MessageBanner error={query.error} /><ListingForm /></main>;
}
