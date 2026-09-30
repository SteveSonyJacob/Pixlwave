"use client";

import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

export default function DiscoverError({ reset }: { error: Error; reset: () => void }) {
  return <main className="dashboard-shell"><EmptyState headingLevel={1} title="Discovery is temporarily unavailable" description="We couldn't load the listings. Please try again in a moment."><Button onClick={reset}>Try again</Button></EmptyState></main>;
}
