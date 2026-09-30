import { describe, expect, it } from "vitest";
import { bookingPageHref, parseBookingFilters } from "./filters";

describe("booking URL filters", () => {
  it("includes the entire IST payment day across the UTC date boundary", () => {
    const filters = parseBookingFilters({ from: "2026-09-29", to: "2026-09-29" });
    expect(filters.paidFrom).toBe("2026-09-28T18:30:00.000Z");
    expect(filters.paidBefore).toBe("2026-09-29T18:30:00.000Z");
  });
  it("rejects impossible dates and reversed ranges without partial filtering", () => {
    for (const query of [{ from: "2026-02-29" }, { from: "2026-09-30", to: "2026-09-29" }, { to: "oops" }]) {
      expect(parseBookingFilters(query)).toMatchObject({ from: "", to: "", invalidRange: true, paidFrom: undefined, paidBefore: undefined });
    }
    expect(parseBookingFilters({ from: "2028-02-29" }).from).toBe("2028-02-29");
  });
  it("supports one-sided ranges and normalizes malformed status and page", () => {
    expect(parseBookingFilters({ to: "2026-09-29", page: "-3", status: "draft" })).toMatchObject({ paidFrom: undefined, page: 1, status: "", invalidRange: false });
    expect(parseBookingFilters({ page: "999999999999" }).page).toBe(1);
    expect(parseBookingFilters({ page: "0" }).page).toBe(1);
  });
  it("preserves filters between pages and omits page 1", () => {
    const filters = parseBookingFilters({ status: "approved", from: "2026-09-29", page: "3" });
    expect(bookingPageHref(filters, 2)).toBe("/bookings?status=approved&from=2026-09-29&page=2");
    expect(bookingPageHref(filters, 1)).toBe("/bookings?status=approved&from=2026-09-29");
    expect(bookingPageHref(parseBookingFilters({}), 1)).toBe("/bookings");
  });
  it("opens a notification target even when it is older than the first page or another filter", () => {
    const bookingLineId = "20000000-0000-4000-8000-000000000001";
    expect(parseBookingFilters({ bookingLineId, status: "approved", from: "2026-09-29", page: "6" })).toMatchObject({ bookingLineId, status: "", from: "", page: 1 });
    expect(parseBookingFilters({ bookingLineId: "untrusted" }).bookingLineId).toBe("");
  });
});
