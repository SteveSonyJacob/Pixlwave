import { Skeleton } from "@/components/ui/feedback";

export default function DiscoverLoading() {
  return <main className="dashboard-shell wide-dashboard discovery-page" aria-busy="true"><div className="dashboard-heading"><div><span className="eyebrow">Kerala media discovery</span><h1>Loading published inventory…</h1></div></div><div className="listing-grid">{Array.from({ length: 6 }, (_, index) => <div className="ui-card" key={index}><Skeleton className="aspect-video" /><div className="flex flex-col gap-4 p-5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-6 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-10 w-1/2" /></div></div>)}</div></main>;
}
