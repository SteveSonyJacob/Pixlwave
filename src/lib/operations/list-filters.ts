export const OPERATIONS_PAGE_SIZE = 20;

export const ticketStatuses = ["active", "open", "in_progress", "resolved", "closed"] as const;
export const notificationChannels = ["in_app", "email", "sms"] as const;

export function operationsPageNumber(value: string | undefined) {
  return value && /^[1-9]\d{0,3}$/.test(value) ? Number(value) : 1;
}

export function parseTicketFilters(query: { status?: string; page?: string }) {
  return {
    status: ticketStatuses.find((status) => status === query.status) ?? "",
    page: operationsPageNumber(query.page)
  };
}

export function ticketPageHref(path: "/support" | "/admin/support", filters: ReturnType<typeof parseTicketFilters>, page: number) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  return `${path}${params.size ? `?${params}` : ""}`;
}

export function parseNotificationFilters(query: { view?: string; channel?: string; page?: string }) {
  const view = query.view === "unread" ? "unread" : "all";
  return {
    view,
    channel: view === "unread" ? "" : notificationChannels.find((channel) => channel === query.channel) ?? "",
    page: operationsPageNumber(query.page)
  };
}

export function notificationPageHref(filters: ReturnType<typeof parseNotificationFilters>, page: number) {
  const params = new URLSearchParams();
  if (filters.view === "unread") params.set("view", "unread");
  if (filters.channel) params.set("channel", filters.channel);
  if (page > 1) params.set("page", String(page));
  return `/notifications${params.size ? `?${params}` : ""}`;
}

export function pageRange(page: number) {
  const first = (page - 1) * OPERATIONS_PAGE_SIZE;
  return [first, first + OPERATIONS_PAGE_SIZE - 1] as const;
}
