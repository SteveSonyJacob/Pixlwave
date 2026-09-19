"use client";

export default function DiscoverError({ reset }: { error: Error; reset: () => void }) {
  return <main className="dashboard-shell"><div className="empty-state inventory-empty"><span>!</span><h1>Discovery is temporarily unavailable</h1><p>Published inventory could not be loaded. No availability or pricing has been guessed.</p><button className="button" onClick={reset}>Try again</button></div></main>;
}
