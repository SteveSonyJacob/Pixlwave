import { describe, expect, it } from "vitest";
import { notificationPageHref, operationsPageNumber, pageRange, parseNotificationFilters, parseTicketFilters, ticketPageHref } from "./list-filters";

describe("operations list filters", () => {
  it("keeps ticket status while paging and rejects invalid query values", () => {
    const filters = parseTicketFilters({ status: "in_progress", page: "3" });
    expect(ticketPageHref("/admin/support", filters, 2)).toBe("/admin/support?status=in_progress&page=2");
    expect(ticketPageHref("/support", filters, 1)).toBe("/support?status=in_progress");
    expect(parseTicketFilters({ status: "active" }).status).toBe("active");
    expect(parseTicketFilters({ status: "private", page: "99999" })).toEqual({ status: "", page: 1 });
    expect(pageRange(3)).toEqual([40, 59]);
    expect(operationsPageNumber("0")).toBe(1);
  });

  it("preserves only supported notification filters", () => {
    const filters = parseNotificationFilters({ view: "unread", channel: "in_app", page: "2" });
    expect(notificationPageHref(filters, 2)).toBe("/notifications?view=unread&page=2");
    expect(parseNotificationFilters({ view: "failed", channel: "private", page: "-1" })).toEqual({ view: "all", channel: "", page: 1 });
  });
});
