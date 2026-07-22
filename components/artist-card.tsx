import Link from "next/link";
import type { Artist } from "@/lib/types";
import { ArrowRight, MapPin, ShieldCheck } from "./icons";

export function ArtistCard({ artist }: { artist: Artist }) {
  const initials = artist.business_name.split(" ").map((word) => word[0]).slice(0, 2).join("");
  const isLogo = artist.profile_image_url?.toLowerCase().includes("logo");
  return (
    <article className="artist-card">
      <Link href={`/artist/${artist.slug}`} className="artist-visual" aria-label={`View ${artist.business_name}`}>
        {artist.profile_image_url ? <img src={artist.profile_image_url} alt={artist.business_name} style={isLogo ? { objectFit: "contain", background: "#fff", padding: 28 } : undefined} /> : <div className="artist-placeholder"><span>{initials}</span><small>Artist portrait</small></div>}
        {artist.featured && <span className="featured-pill">Featured</span>}
      </Link>
      <div className="artist-card-body">
        <div className="verified-line"><ShieldCheck size={15} /> Verified artist</div>
        <h3><Link href={`/artist/${artist.slug}`}>{artist.business_name}</Link></h3>
        <p className="location"><MapPin size={16} /> {artist.states_served.slice(0, 2).join(" · ")}</p>
        <div className="chips">{artist.categories.slice(0, 3).map((category) => <span key={category}>{category}</span>)}</div>
        <Link className="card-link" href={`/artist/${artist.slug}`}>View artist <ArrowRight size={17} /></Link>
      </div>
    </article>
  );
}
