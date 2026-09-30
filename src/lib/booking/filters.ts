export const bookingStatuses = ["paid_pending", "approved", "rejected", "deadline_rejected", "cancelled", "payment_ineligible"] as const;
export const BOOKING_PAGE_SIZE = 20;
export type BookingFilterQuery = { status?: string; from?: string; to?: string; page?: string; bookingLineId?: string };

function validDate(value: string | undefined) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "9998-12-31") return "";
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? value : "";
}

/** Payment-date filters use IST calendar boundaries, including the entire end date. */
export function parseBookingFilters(query: BookingFilterQuery) {
  let from = validDate(query.from);
  let to = validDate(query.to);
  const invalidRange = Boolean(query.from && !from || query.to && !to || from && to && from > to);
  if (invalidRange) { from = ""; to = ""; }
  const rawPage = query.page && /^\d{1,5}$/.test(query.page) ? Number(query.page) : 1;
  const bookingLineId = typeof query.bookingLineId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query.bookingLineId) ? query.bookingLineId : "";
  if (bookingLineId) { from = ""; to = ""; }
  return {
    status: bookingLineId ? "" : bookingStatuses.find((status) => status === query.status) ?? "",
    from, to, invalidRange, page: bookingLineId ? 1 : Math.max(1, rawPage), bookingLineId,
    paidFrom: from ? new Date(`${from}T00:00:00+05:30`).toISOString() : undefined,
    paidBefore: to ? new Date(Date.parse(`${to}T00:00:00+05:30`) + 86_400_000).toISOString() : undefined
  };
}

export function bookingPageHref(filters: ReturnType<typeof parseBookingFilters>, page: number, pathname: "/bookings" | "/admin/bookings" = "/bookings") {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (page > 1) query.set("page", String(page));
  return `${pathname}${query.size ? `?${query}` : ""}`;
}
