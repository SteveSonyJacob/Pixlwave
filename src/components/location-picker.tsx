"use client";

import { useState } from "react";

type Place = { provider: "mappls" | "google" | "manual"; placeId: string; label: string; locality: string; district: string; latitude: number; longitude: number };

export function LocationPicker({ initial }: { initial?: Place }) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [message, setMessage] = useState("Search Mappls first, or enter a verified Kerala pin manually.");
  const [selected, setSelected] = useState<Place | null>(initial ?? null);

  async function search() {
    setMessage("Searching Mappls…");
    const response = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);
    const body = await response.json() as { places?: Place[]; error?: string; provider?: string; warning?: string };
    setPlaces(body.places ?? []);
    setMessage(body.error ?? (body.places?.length ? `${body.places.length} result(s) from ${body.provider}.` : "No Kerala results found. Check the pin manually."));
  }

  return <fieldset className="form-fieldset">
    <legend>Kerala location and pin</legend>
    <div className="location-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a road, venue or locality" /><button className="button button-secondary button-small" type="button" onClick={search}>Search</button></div>
    <small className="muted" role="status">{message}</small>
    {places.length ? <div className="place-results">{places.map((place) => <button type="button" key={`${place.provider}:${place.placeId}`} onClick={() => { setSelected(place); setPlaces([]); setMessage(`Selected ${place.label}. Verify the district and pin below.`); }}>{place.label}<small>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</small></button>)}</div> : null}
    <div className="field-row three-fields">
      <label>Locality<input name="locality" required defaultValue={selected?.locality ?? ""} key={`locality-${selected?.placeId}`} /></label>
      <label>District<select name="district" required defaultValue={selected?.district ?? ""} key={`district-${selected?.placeId}`}><option value="">Select district</option>{["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"].map((district) => <option key={district}>{district}</option>)}</select></label>
      <label>Provider<select name="sourceProvider" defaultValue={selected?.provider ?? "manual"} key={`provider-${selected?.placeId}`}><option value="mappls">Mappls</option><option value="google">Google fallback</option><option value="manual">Manual verified pin</option></select></label>
    </div>
    <div className="field-row three-fields">
      <label>Latitude<input name="latitude" type="number" min="8.17" max="12.8" step="0.000001" required defaultValue={selected?.latitude ?? ""} key={`lat-${selected?.placeId}`} /></label>
      <label>Longitude<input name="longitude" type="number" min="74.8" max="77.6" step="0.000001" required defaultValue={selected?.longitude ?? ""} key={`lng-${selected?.placeId}`} /></label>
      <label>Provider place ID<input name="sourcePlaceId" required defaultValue={selected?.placeId ?? "manual-pin"} key={`id-${selected?.placeId}`} /></label>
    </div>
  </fieldset>;
}
