import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instagram, MapPin, MessageCircle, ShieldCheck } from "@/components/icons";
import { getApprovedArtists, getArtist } from "@/lib/data";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getApprovedArtists()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtist((await params).slug);
  if (!artist) return {};
  const state = artist.states_served[0] || "Nigeria";
  const description = artist.bio.length > 155 ? `${artist.bio.slice(0, 152)}…` : artist.bio;
  return {
    title: `${artist.business_name} | Portrait Artist in ${state}, Nigeria`,
    description,
    openGraph: {
      title: `${artist.business_name} — Nigerian Portrait Artist`,
      description,
      images: artist.profile_image_url ? [artist.profile_image_url] : [],
    },
  };
}

export default async function ArtistPage({ params }: Props) {
  const artist = await getArtist((await params).slug);
  if (!artist) notFound();
  const initials = artist.business_name.split(" ").map((word) => word[0]).slice(0, 2).join("");
  const isLogo = artist.profile_image_url?.toLowerCase().includes("logo");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: artist.business_name,
    description: artist.bio,
    image: artist.profile_image_url,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://artistinnigeria.com"}/artist/${artist.slug}`,
    areaServed: artist.states_served,
    founder: artist.owner_name,
    priceRange: artist.price_range,
    sameAs: [artist.instagram, artist.portfolio_link].filter(Boolean),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="profile-hero"><div className="shell profile-grid">
      <div className="profile-photo">{artist.profile_image_url
        ? <img src={artist.profile_image_url} alt={`${artist.business_name} logo`} style={isLogo ? { objectFit: "contain", background: "#fff", padding: 36 } : undefined} />
        : <div className="artist-placeholder"><span>{initials}</span><small>{artist.owner_name}</small></div>}
      </div>
      <div>
        <p className="eyebrow"><ShieldCheck size={15} /> Verified Nigerian portrait artist</p>
        <h1 className="profile-title">{artist.business_name}</h1>
        <p className="location"><MapPin size={17} />{artist.states_served.join(" · ")}</p>
        <div className="chips">{artist.categories.map((category) => <span key={category}>{category}</span>)}</div>
        <p className="profile-bio">{artist.bio}</p>
        <div className="profile-meta">
          <div><small>Artist</small>{artist.owner_name}</div>
          <div><small>Typical price</small>{artist.price_range || "Ask for a quote"}</div>
          <div><small>Based / serves</small>{artist.states_served.join(", ")}</div>
          <div><small>Contact</small>Direct with the artist</div>
        </div>
        <div className="profile-actions">
          <a className="button" href={`https://wa.me/${artist.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener"><MessageCircle size={18} /> Message on WhatsApp</a>
          {artist.portfolio_link && <a className="button button-dark" href={artist.portfolio_link} target="_blank" rel="noopener">Visit Artist Website</a>}
          {artist.instagram && <a className="text-link" href={artist.instagram} target="_blank" rel="noopener"><Instagram size={18} /> Instagram</a>}
        </div>
      </div>
    </div></section>
    {artist.portfolio_image_urls.length > 0 && <section className="section process"><div className="shell">
      <div className="section-heading"><p className="eyebrow">Original artwork</p><h2>{artist.business_name} Portfolio</h2></div>
      <div className="portfolio-grid">{artist.portfolio_image_urls.map((url, index) => <img src={url} alt={`${artist.business_name} portrait artwork ${index + 1}`} key={url} />)}</div>
    </div></section>}
    <section className="cta-band"><div className="shell"><div><p className="eyebrow eyebrow-light">Find local creatives</p><h2>Browse More Portrait Artists in Nigeria</h2></div><div><p>Explore verified portrait painters and other professional artists across all 36 states and the FCT.</p><Link className="button button-light" href="/portrait-artist-in-nigeria">Browse Nigerian Artists</Link></div></div></section>
  </>;
}
