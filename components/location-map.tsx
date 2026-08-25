export function LocationMap({ query, label }: { query: string; label: string }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return <div className="map-frame"><iframe title={`Map of ${label}`} src={src} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>;
}
