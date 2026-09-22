import { describe, expect, it, vi } from "vitest";
import { processBookingDeadlines } from "./booking-deadlines";

describe("booking deadline worker", () => {
  it("runs reminders and expiry against the same trusted clock", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ sent: 3 }] })
      .mockResolvedValueOnce({ rows: [{ expired: 2 }] });
    const now = new Date("2026-10-08T04:30:00.000Z");
    await expect(processBookingDeadlines({ query }, now)).resolves.toEqual({ reminders: 3, expired: 2 });
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("send_booking_review_reminders"), [now]);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("expire_booking_review_deadlines"), [now]);
  });
});
