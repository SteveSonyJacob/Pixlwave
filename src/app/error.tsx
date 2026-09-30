"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return <main className="dashboard-shell"><EmptyState headingLevel={1} title="This page could not be loaded" description="Your saved work and payment records remain on the server. Try loading this page again."><div className="review-actions"><Button onClick={reset}>Try again</Button><Link className="button button-secondary" href="/account">Open account</Link></div></EmptyState></main>;
}
