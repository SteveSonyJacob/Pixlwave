"use client";

import { useState } from "react";
import { LocationMap } from "@/components/location-map";
import { inKerala, type MapPlace } from "@/lib/maps/nominatim";

type InitialPlace = Omit<MapPlace, "provider"> & { provider: MapPlace["provider"] | "mappls" | "google" };

export function LocationPicker({ initial }: { initial?: InitialPlace }) {
  const normalizedInitial = initial ? { ...initial, provider: initial.provider === "openstreetmap" ? "openstreetmap" as const : "manual" as const } : undefined;
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [message, setMessage] = useState("Search OpenStreetMap, click the map, or enter a verified Kerala pin.");
  const [busy, setBusy] = useState(false);
  const [locality, setLocality] = useState(normalizedInitial?.locality ?? "");
  const [district, setDistrict] = useState(normalizedInitial?.district ?? "");
  const [latitude, setLatitude] = useState(normalizedInitial?.latitude ?? Number.NaN);
  const [longitude, setLongitude] = useState(normalizedInitial?.longitude ?? Number.NaN);
  const [provider, setProvider] = useState<MapPlace["provider"]>(normalizedInitial?.provider ?? "manual");
  const [placeId, setPlaceId] = useState(normalizedInitial?.placeId || "manual-pin");

  async function search() {
    if (query.trim().length < 3) return setMessage("Enter at least 3 characters.");
    setBusy(true);
    setMessage("Searching OpenStreetMap…");
    try {
      const response = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);
      const body = await response.json() as { places?: MapPlace[]; error?: string; provider?: string };
      setPlaces(body.places ?? []);
      setMessage(body.error ?? (body.places?.length ? `${body.places.length} OpenStreetMap result(s).` : "No Kerala results found. Place the pin manually."));
    } catch {
      setMessage("Location search is unavailable. Place the pin manually.");
    } finally {
      setBusy(false);
    }
  }

  function select(place: MapPlace) {
    setLocality(place.locality);
    setDistrict(place.district);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setProvider("openstreetmap");
    setPlaceId(place.placeId);
    setPlaces([]);
    setMessage(`Selected ${place.label}. Verify the district and pin.`);
  }

  function setManualPin(next: { latitude: number; longitude: number }) {
    setLatitude(next.latitude);
    setLongitude(next.longitude);
    setProvider("manual");
    setPlaceId("manual-pin");
    setMessage("Manual pin selected. Verify the locality and district.");
  }

  const coordinate = inKerala(latitude, longitude) ? { latitude, longitude } : undefined;

  return <fieldset className="form-fieldset">
    <legend>Kerala location and pin</legend>
    <div className="location-search"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} placeholder="Search a road, venue or locality" /><button className="button button-secondary button-small" type="button" disabled={busy} onClick={() => void search()}>{busy ? "Searching…" : "Search"}</button></div>
    <small className="muted" role="status">{message}</small>
    {places.length ? <div className="place-results">{places.map((place) => <button type="button" key={`${place.provider}:${place.placeId}`} onClick={() => select(place)}>{place.label}<small>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</small></button>)}</div> : null}
    <LocationMap coordinate={coordinate} onChange={setManualPin} />
    <small className="map-help">Map data © OpenStreetMap contributors. Search runs only when you press Search; drag the marker for exact placement.</small>
    <div className="field-row three-fields">
      <label>Locality<input name="locality" required value={locality} onChange={(event) => { setLocality(event.target.value); setProvider("manual"); setPlaceId("manual-pin"); }} /></label>
      <label>District<select name="district" required value={district} onChange={(event) => { setDistrict(event.target.value); setProvider("manual"); setPlaceId("manual-pin"); }}><option value="">Select district</option>{["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Source<input value={provider === "openstreetmap" ? "OpenStreetMap search" : "Manual verified pin"} readOnly /></label>
    </div>
    <div className="field-row three-fields">
      <label>Latitude<input name="latitude" type="number" min="8.17" max="12.8" step="0.000001" required value={Number.isFinite(latitude) ? latitude : ""} onChange={(event) => setManualPin({ latitude: Number(event.target.value), longitude })} /></label>
      <label>Longitude<input name="longitude" type="number" min="74.8" max="77.6" step="0.000001" required value={Number.isFinite(longitude) ? longitude : ""} onChange={(event) => setManualPin({ latitude, longitude: Number(event.target.value) })} /></label>
      <label>Provider place ID<input value={placeId} readOnly /></label>
    </div>
    <input type="hidden" name="sourceProvider" value={provider} />
    <input type="hidden" name="sourcePlaceId" value={placeId} />
  </fieldset>;
}
