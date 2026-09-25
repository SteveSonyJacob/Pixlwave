"use client";

type Blackout = { starts_on: string; ends_on: string; reason: string };
type Show = { id: string; starts_at: string; slots_total: number };

function keralaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const read = (kind: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === kind)?.value ?? "01";
  return { year: Number(read("year")), month: Number(read("month")), day: Number(read("day")) };
}

function dateKey(date: Date) {
  const { year, month, day } = keralaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ category, blackouts, shows, demo = false }: { category: "led" | "theatre" | "mobile"; blackouts: Blackout[]; shows: Show[]; demo?: boolean }) {
  const today = keralaDateParts(new Date());
  const start = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const dates = Array.from({ length: 28 }, (_, index) => new Date(start.getTime() + index * 86_400_000));
  const showCounts = new Map<string, number>();
  for (const show of shows) {
    const key = dateKey(new Date(show.starts_at));
    showCounts.set(key, (showCounts.get(key) ?? 0) + 1);
  }
  return <section className="detail-section availability-calendar"><h2>{demo ? "Sample availability" : "Published availability"}</h2><p>{demo ? "Illustrative dates and shows for local layout preview. They do not reflect bookable capacity." : "Availability is provisional until an administrator confirms a later paid request. Blackouts and published show instances are shown in IST."}</p><div className="calendar-legend"><span><i className="calendar-open" />{demo ? "Sample open date" : "Available to quote"}</span><span><i className="calendar-blocked" />Unavailable</span>{category === "theatre" ? <span><i className="calendar-show" />{demo ? "Sample show" : "Published show"}</span> : null}</div><div className="calendar-grid" role="grid" aria-label={`Next 28 days of ${demo ? "sample" : "published"} availability`}>{dates.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const blackout = blackouts.find((item) => key >= item.starts_on && key <= item.ends_on);
    const showsOnDay = showCounts.get(key) ?? 0;
    const unavailable = Boolean(blackout) || (category === "theatre" && showsOnDay === 0);
    const display = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }).format(date);
    const reason = blackout ? blackout.reason : category === "theatre" && showsOnDay === 0 ? demo ? "No sample show" : "No published show" : category === "theatre" ? `${showsOnDay} ${demo ? "sample" : "published"} ${showsOnDay === 1 ? "show" : "shows"}` : demo ? "Sample open date" : "Available to quote";
    return <div key={key} role="gridcell" className={`calendar-day ${unavailable ? "unavailable" : "available"} ${showsOnDay ? "has-show" : ""}`} aria-label={`${display}: ${reason}`}><b>{display}</b><small>{reason}</small></div>;
  })}</div></section>;
}
