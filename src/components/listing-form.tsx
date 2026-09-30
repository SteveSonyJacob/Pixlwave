"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeListingDraft, createListing, updateListing } from "@/app/owner/actions";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Badge, Notice } from "@/components/ui/feedback";
import { inKerala, type MapPlace } from "@/lib/maps/nominatim";
import { googleMapsLocationUrl } from "@/lib/maps/google-maps-url";
import { fieldsForStep, listingDefaults, listingFormData, listingFormSchema, type InitialListing, type ListingFormValues } from "./listing-form-model";
import type { DraftContext } from "@/lib/inventory/drafts";
import { useListingAutosave } from "./use-listing-autosave";
import { discardListingCheckpoint } from "@/app/owner/draft-actions";
import { Stepper } from "@/components/ui/stepper";

const steps = ["Screen details", "Specifications", "Pricing & availability", "Media & review"];
const formats = { led: "LED / digital", theatre: "Theatre shows", mobile: "Mobile billboard" };
type FieldName = keyof ListingFormValues;

export function ListingForm({ initial, draft, media }: { initial?: InitialListing; draft?: DraftContext; media?: ReactNode }) {
  const [step, setStep] = useState(draft?.step ?? 0);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(0);
  const { register, control, getValues, setValue, trigger, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<ListingFormValues>({
    defaultValues: draft?.payload ?? listingDefaults(initial), resolver: zodResolver(listingFormSchema), shouldUnregister: false, mode: "onTouched"
  });
  const values = useWatch({ control });
  const category = values.category ?? "led";
  const saving = isSubmitting || isPending;
  const autosave = useListingAutosave(draft, getValues(), step, saving);
  const hasUnsavedChanges = draft ? autosave.state.status !== "saved" : isDirty;

  useEffect(() => {
    if (stepErrors.length) errorRef.current?.focus();
    else if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step, stepErrors]);

  useEffect(() => {
    if (!hasUnsavedChanges || saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, saving]);

  const updateLocation = useCallback((place: MapPlace) => {
    const fields = {
      locality: place.locality, district: place.district, sourceProvider: place.provider, sourcePlaceId: place.placeId,
      latitude: Number.isFinite(place.latitude) ? String(place.latitude) : "",
      longitude: Number.isFinite(place.longitude) ? String(place.longitude) : ""
    };
    for (const [name, value] of Object.entries(fields)) setValue(name as FieldName, value, { shouldDirty: true });
  }, [setValue]);

  const fieldError = (name: FieldName) => errors[name]?.message;
  function input(name: FieldName, label: string, options: { type?: string; hint?: string; min?: number; max?: number; step?: string; readOnly?: boolean } = {}) {
    return <TextField {...register(name)} id={`listing-${name}`} label={label} error={fieldError(name)} {...options} />;
  }
  function textarea(name: FieldName, label: string, hint?: string, rows = 3) {
    return <div className="ui-field"><label htmlFor={`listing-${name}`}>{label}</label><textarea {...register(name)} id={`listing-${name}`} rows={rows} aria-invalid={Boolean(fieldError(name))} aria-describedby={[hint && `${name}-hint`, fieldError(name) && `${name}-error`].filter(Boolean).join(" ") || undefined} />{hint ? <small id={`${name}-hint`} className="ui-field-hint">{hint}</small> : null}{fieldError(name) ? <p id={`${name}-error`} className="ui-field-error">{fieldError(name)}</p> : null}</div>;
  }
  function changeStep(next: number) { setStepErrors([]); setStep(next); }

  async function advance() {
    const names = fieldsForStep(step, category);
    if (await trigger(names, { shouldFocus: false })) return changeStep(step + 1);
    const parsed = listingFormSchema.safeParse(getValues());
    if (!parsed.success) setStepErrors(parsed.error.issues.filter((issue) => names.includes(issue.path[0] as FieldName)).map((issue) => `${String(issue.path[0]).replace(/([A-Z])/g, " $1")}: ${issue.message}`));
  }

  function invalid(allErrors: FieldErrors<ListingFormValues>) {
    const first = [0, 1, 2].find((index) => fieldsForStep(index, category).some((key) => allErrors[key]));
    setStep(first ?? 0);
    setStepErrors(fieldsForStep(first ?? 0, category).flatMap((key) => allErrors[key]?.message ? [`${key.replace(/([A-Z])/g, " $1")}: ${allErrors[key]?.message}`] : []));
  }

  async function save() {
    await handleSubmit((data) => {
      startTransition(async () => {
        if (draft && autosave.manager) {
          autosave.manager.update({ payload: data, step });
          if (!await autosave.manager.flush(true)) return;
          const result = await completeListingDraft({ id: draft.id, revision: autosave.manager.state.revision });
          if (!result.ok) setStepErrors([result.message]);
          return;
        }
        const action = initial?.id ? updateListing : createListing;
        await action(listingFormData(data, initial?.id));
      });
    }, invalid)();
  }

  const current = getValues();
  const price = Number(values.baseRateRupees);
  return <form noValidate className="listing-wizard" onSubmit={(event) => { event.preventDefault(); if (saving) return; if (step < 3) void advance(); else void save(); }}>
    <Stepper items={steps} current={step} disabled={saving} onStepChange={changeStep} />
    <div className="wizard-layout">
      <section className="panel-card wizard-panel form-stack" aria-labelledby="wizard-heading">
        <div><span className="eyebrow">Step {step + 1} of {steps.length}</span><h2 id="wizard-heading" ref={headingRef} tabIndex={-1}>{steps[step]}</h2></div>
        {draft ? <div className="wizard-autosave"><p role="status">{autosave.state.status === "saving" ? "Saving your progress…" : autosave.state.status === "unsaved" ? "Changes waiting to save…" : autosave.state.status === "saved" ? autosave.state.revision ? "Progress saved privately. You can resume from My inventory." : "Your progress will save automatically as you type." : autosave.state.message}</p>{autosave.state.status === "error" ? <Button size="sm" variant="secondary" onClick={() => startTransition(async () => { await autosave.manager?.flush(); })}>Retry saving</Button> : null}{autosave.state.status === "conflict" ? <><p>Copy any local changes you want to keep before loading the saved version.</p><Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Reload saved version</Button></> : null}</div> : null}
        {stepErrors.length ? <div className="wizard-errors" ref={errorRef} tabIndex={-1} role="alert"><b>Check these details to continue</b><ul>{stepErrors.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}</ul></div> : null}
        {draft && autosave.state.status === "conflict" ? <details><summary>Discard this autosave</summary><p>This removes the autosaved edits from your work list. Copy anything you need before continuing.</p><Button variant="danger" size="sm" disabled={saving} onClick={() => startTransition(async () => {
          const result = await discardListingCheckpoint({ id: draft.id, revision: autosave.manager?.state.revision });
          if (!result.ok) { setStepErrors([result.message]); return; }
          window.location.assign(draft.listingId ? `/owner/listings/${draft.listingId}/edit` : "/owner/listings/new");
        })}>Discard autosave and load saved listing</Button></details> : null}

        {step === 0 ? <>
          <fieldset className="wizard-format"><legend>Screen format</legend><div className="category-choice">{(["led", "theatre", "mobile"] as const).map((format) => <label key={format} className={category === format ? "selected" : ""}><input {...register("category")} type="radio" value={format} disabled={Boolean(initial?.id) && format !== initial?.category} /><b>{formats[format]}</b><small>{format === "led" ? "One advertiser per whole day" : format === "theatre" ? "Slots for each show" : "Rotating slots on a vehicle"}</small></label>)}</div></fieldset>
          {input("title", "Screen name")}
          {textarea("description", "About this screen", "Describe the placement and its surroundings. Use 20–2,000 characters.", 4)}
          <LocationPicker onChange={updateLocation} initial={{ provider: current.sourceProvider === "openstreetmap" ? "openstreetmap" : "manual", placeId: current.sourcePlaceId, label: current.locality, locality: current.locality, district: current.district, latitude: current.latitude ? Number(current.latitude) : Number.NaN, longitude: current.longitude ? Number(current.longitude) : Number.NaN }} />
          {inKerala(Number(values.latitude), Number(values.longitude)) ? <a className="listing-location-link" href={googleMapsLocationUrl(Number(values.latitude), Number(values.longitude))} target="_blank" rel="noopener noreferrer">Check this screen location in Google Maps ↗</a> : null}
          {input("pincode", "Pincode", { hint: "Six-digit Kerala service-location pincode." })}
        </> : null}

        {step === 1 ? <>
          <div className="field-row">{input("adDurationSeconds", "Ad duration (seconds)", { type: "number", min: 5, max: 120 })}{input("playsPerUnit", `Plays per ${category === "theatre" ? "show" : "day"}`, { type: "number", min: 1, max: 2000 })}</div>
          {category === "led" ? <><div className="field-row">{input("screenWidthPx", "Creative width (pixels)", { type: "number", min: 320, max: 16384 })}{input("screenHeightPx", "Creative height (pixels)", { type: "number", min: 240, max: 8640 })}</div><div className="field-row">{input("physicalWidthMetres", "Screen width (metres)", { type: "number", min: 0.1, max: 100, step: "any" })}{input("physicalHeightMetres", "Screen height (metres)", { type: "number", min: 0.1, max: 100, step: "any" })}</div>{input("pixelPitch", "Pixel pitch", { hint: "Example: P6 (6 mm)." })}<Notice>LED bookings cover the whole screen for a day, with one advertiser per day.</Notice></> : null}
          {category === "theatre" ? <><div className="field-row">{input("venueName", "Venue name")}{input("auditoriumName", "Auditorium")}</div>{input("slotsPerShow", "Slots per show", { type: "number", min: 1, max: 50 })}{textarea("showStarts", "Upcoming show starts", "One date and time per line, including timezone. Example: 2026-10-12T18:30:00+05:30", 4)}</> : null}
          {category === "mobile" ? <><div className="field-row">{input("vehicleLabel", "Vehicle or fleet label")}{input("rotatingSlots", "Rotating slots", { type: "number", min: 1, max: 30 })}</div>{input("routeName", "Published route name")}{textarea("routeGeoJson", "Route geometry (GeoJSON LineString)", "Enter the route coordinates supplied by your mapping team.", 5)}<label className="check"><input {...register("customRouteAllowed")} type="checkbox" /> Allow custom-route requests when no approved booking overlaps the dates</label></> : null}
          <div className="field-row">{input("facingDirection", "Facing direction", { hint: "Example: North toward MG Road." })}<div className="ui-field"><label htmlFor="listing-trafficType">Traffic type</label><select {...register("trafficType")} id="listing-trafficType"><option value="high">High traffic</option><option value="medium">Medium traffic</option><option value="low">Low traffic</option><option value="venue">Venue audience</option></select></div></div>
          <div className="field-row"><div className="ui-field"><label htmlFor="listing-visibility">Visibility</label><select {...register("visibility")} id="listing-visibility"><option value="day_night">Day and night</option><option value="day">Day</option><option value="night">Night</option></select></div>{textarea("facilities", "Facilities and features", "Comma-separated, for example: power backup, parking nearby, smart CMS.", 2)}</div>
          <div className="field-row">{input("audienceEstimate", "Estimated audience", { type: "number", min: 1, max: 100000000 })}{input("audienceBasis", "How was the audience estimated?", { hint: "Include the source, method and date." })}</div>
        </> : null}

        {step === 2 ? <>
          {input("baseRateRupees", `Base rate (₹ / ${category === "led" ? "day" : category === "theatre" ? "show slot" : "vehicle day slot"})`, { type: "number", min: 100, max: 10000000, step: "0.01", readOnly: initial?.status === "published", hint: initial?.status === "published" ? "The published rate stays fixed. Only an administrator can change it after recording the owner discussion." : undefined })}
          <div className="field-row">{input("operatingStart", "Operating start", { type: "time" })}{input("operatingEnd", "Operating end", { type: "time" })}</div>
          {textarea("servicePromise", "What will you deliver?", "Describe the service and how you will provide proof of delivery. Use 20–1,000 characters.", 4)}
          {textarea("blackouts", "Unavailable or self-use dates (optional)", "One range per line: 2026-10-20|2026-10-22|Owner campaign")}
          <Notice>{initial?.status === "published" ? "To use your own screen, add the dates above, save this replacement, and submit it for admin review. Dates become unavailable only after approval; active checkouts and paid bookings cannot be displaced." : "Admin approval is required for your service terms, unavailable dates and initial price before this listing can go live."}</Notice>
        </> : null}

        {step === 3 ? <>
          {media ?? <Notice>Save the listing draft first, then reopen it to upload validated gallery images.</Notice>}
          <p className="muted">Review your details before saving. You can return to a previous step to make changes.</p>
          <dl className="wizard-review"><dt>Screen name</dt><dd>{values.title}</dd><dt>Description</dt><dd>{values.description}</dd><dt>Location</dt><dd>{values.locality}, {values.district} · {values.pincode}<br />{values.latitude}, {values.longitude}</dd><dt>Visibility</dt><dd>{values.facingDirection || "Not specified"} · {values.trafficType?.replaceAll("_", " ") ?? "not specified"} · {values.visibility?.replaceAll("_", " & ") ?? "not specified"}</dd><dt>Facilities</dt><dd>{values.facilities || "None entered"}</dd><dt>Audience estimate</dt><dd>{values.audienceEstimate} — {values.audienceBasis}</dd><dt>Service promise</dt><dd>{values.servicePromise}</dd><dt>Unavailable dates</dt><dd>{values.blackouts || "None entered"}</dd>{category === "theatre" ? <><dt>Venue and shows</dt><dd>{values.venueName}, {values.auditoriumName} · {values.slotsPerShow} slots per show<br />{values.showStarts}</dd></> : null}{category === "mobile" ? <><dt>Vehicle and route</dt><dd>{values.vehicleLabel} · {values.rotatingSlots} rotating slots<br />{values.routeName}<br />Custom routes: {values.customRouteAllowed ? "Allowed" : "Not allowed"}</dd></> : null}</dl>
          <Notice>{initial?.status === "published" ? "Saving creates a replacement revision. The current public listing remains unchanged until an administrator approves it." : initial?.id ? "Save your changes, then submit the draft from My inventory when the details and photos are ready." : "Save your draft first. Then open it from My inventory to add photos and submit it for admin review."}</Notice>
        </> : null}

        <div className="wizard-controls"><Button variant="secondary" disabled={step === 0 || saving} onClick={() => changeStep(step - 1)}>Back</Button>{step < 3 ? <Button onClick={() => void advance()}>Continue</Button> : <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving draft…" : initial?.id ? "Update listing draft" : "Save listing draft"}</Button>}</div>
        <small className="muted">{draft ? "Autosave keeps your progress private. Save the completed listing draft before adding photos or submitting it for review." : "Your changes stay in this form while moving between steps. Save the draft before leaving this page."}</small>
      </section>

      <aside className="wizard-summary" aria-label="Your listing summary"><div className="wizard-summary-heading"><h2>Your listing summary</h2><Badge>Draft preview</Badge></div><div className="wizard-summary-body"><h3>{values.title || "Your screen name"}</h3><p className="muted">{[values.locality, values.district].filter(Boolean).join(", ") || "Choose a location"}</p><dl><dt>Format</dt><dd>{formats[category]}</dd>{category === "led" ? <><dt>Screen size</dt><dd>{values.physicalWidthMetres || "—"} × {values.physicalHeightMetres || "—"} m</dd><dt>Creative resolution</dt><dd>{values.screenWidthPx || "—"} × {values.screenHeightPx || "—"} px</dd></> : null}<dt>Ad duration</dt><dd>{values.adDurationSeconds || "—"} seconds</dd><dt>Plays per {category === "theatre" ? "show" : "day"}</dt><dd>{values.playsPerUnit || "—"}</dd><dt>Base rate</dt><dd>{price > 0 && Number.isFinite(price) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(price) : "—"}<small>per {category === "led" ? "day" : category === "theatre" ? "show slot" : "vehicle day slot"}</small></dd><dt>Operating hours</dt><dd>{values.operatingStart || "—"} – {values.operatingEnd || "—"}</dd></dl><Notice>Your listing becomes available to advertisers after admin approval and publication.</Notice></div></aside>
    </div>
  </form>;
}
