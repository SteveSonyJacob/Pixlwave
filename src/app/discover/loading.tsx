export default function DiscoverLoading() {
  return <main className="dashboard-shell wide-dashboard discovery-page" aria-busy="true"><div className="dashboard-heading"><div><span className="eyebrow">Kerala media discovery</span><h1>Loading published inventory…</h1></div></div><div className="discovery-grid loading-grid">{Array.from({ length: 4 }, (_, index) => <div className="discovery-card loading-card" key={index} />)}</div></main>;
}
