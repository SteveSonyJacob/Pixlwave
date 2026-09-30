"use client";

import { useState } from "react";

type Show = { id: string; starts_at: string; slots_total: number };
type Props = {
  category: "led" | "theatre" | "mobile";
  minDate: string;
  shows: Show[];
  mobileSlots: number;
};

function addUtcDays(date: string, days: number) {
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) ? new Date(time + days * 86_400_000).toISOString().slice(0, 10) : undefined;
}

function inclusiveDayCount(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs ? Math.floor((endMs - startMs) / 86_400_000) + 1 : 0;
}

export function QuoteUnitSelector({ category, minDate, shows, mobileSlots }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("1");
  const selectedShowRows = shows.filter((show) => selectedShows.includes(show.id));
  const showQuantityMax = selectedShowRows.length ? Math.min(50, ...selectedShowRows.map((show) => show.slots_total)) : 50;
  const days = inclusiveDayCount(startDate, endDate);
  const requestedUnits = category === "theatre" ? selectedShows.length * Number(quantity) : days * (category === "mobile" ? Number(quantity) : 1);

  return <>
    {category === "theatre" ? shows.length ? <>
      <fieldset className="quote-show-fieldset"><legend>Choose one or more published shows</legend><div className="quote-show-options">{shows.map((show) => <label key={show.id} className="quote-show-option"><input type="checkbox" name="showInstanceIds" value={show.id} checked={selectedShows.includes(show.id)} disabled={!selectedShows.includes(show.id) && selectedShows.length >= 31} onChange={(event) => setSelectedShows((current) => event.target.checked ? [...current, show.id] : current.filter((id) => id !== show.id))} /><span>{new Date(show.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST<small>Up to {show.slots_total} published slot{show.slots_total === 1 ? "" : "s"} per show</small></span></label>)}</div></fieldset>
      <label>Slots per selected show<input name="quantity" type="number" min="1" max={showQuantityMax} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
      <p className="small-note" role="status">{selectedShows.length ? `${selectedShows.length} show${selectedShows.length === 1 ? "" : "s"} selected · ${requestedUnits} requested slot${requestedUnits === 1 ? "" : "s"}.` : "Choose at least one show. You may select up to 31."} Remaining capacity is checked by the server and again during admin approval.</p>
    </> : <p>No upcoming published shows are available for a quote.</p> : <>
      <div className="two-fields"><label>Start date<input name="startDate" type="date" min={minDate} value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label><label>End date (inclusive)<input name="endDate" type="date" min={startDate || minDate} max={startDate ? addUtcDays(startDate, 30) : undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label></div>
      {category === "mobile" ? <label>Rotating slots per date<input name="quantity" type="number" min="1" max={mobileSlots} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label> : null}
      <p className="small-note" role="status">{days && days <= 31 ? `${days} whole service day${days === 1 ? "" : "s"} · ${requestedUnits} ${category === "mobile" ? "rotating slots" : "screen days"} requested.` : "Choose an inclusive date range of 1 to 31 days."} Published blackouts and eligibility are checked by the server; this selection does not reserve capacity.</p>
    </>}
    <button className="button" disabled={category === "theatre" && !shows.length}>Create 30-minute quote</button>
  </>;
}
