import { Notice } from "@/components/ui/feedback";

export function MessageBanner({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <Notice tone={error ? "danger" : "success"} role={error ? "alert" : "status"}>{error || message}</Notice>;
}
