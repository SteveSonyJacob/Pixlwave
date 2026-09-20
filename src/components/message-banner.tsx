export function MessageBanner({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <div className={`banner ${error ? "banner-error" : "banner-success"}`} role={error ? "alert" : "status"}>{error || message}</div>;
}
