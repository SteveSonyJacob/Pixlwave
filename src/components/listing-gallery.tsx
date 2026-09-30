"use client";

import { useState } from "react";
import Image from "next/image";
import type { PublishedMedia } from "@/lib/discovery/data";

export function ListingGallery({ listingId, title, category, media }: { listingId: string; title: string; category: string; media: PublishedMedia[] }) {
  const [selected, setSelected] = useState(0);
  const active = media[Math.min(selected, media.length - 1)];
  if (!active) return <div className={`media-placeholder format-${category}`}><b>{category.toUpperCase()}</b><span>Owner photography is pending</span></div>;
  const src = (asset: PublishedMedia) => asset.url ?? `/api/inventory/${listingId}/media/${asset.id}`;
  return <div className="listing-gallery">
    <div className="listing-gallery-main"><Image src={src(active)} alt={`${title} — ${active.original_name}`} width={1200} height={800} priority unoptimized /></div>
    {media.length > 1 ? <div className="listing-gallery-thumbs" role="group" aria-label="Screen photos">{media.map((asset, index) => <button type="button" key={asset.id} aria-label={`Show photo ${index + 1}: ${asset.original_name}`} aria-pressed={index === selected} onClick={() => setSelected(index)}><Image src={src(asset)} alt="" width={160} height={96} unoptimized /></button>)}</div> : null}
  </div>;
}
