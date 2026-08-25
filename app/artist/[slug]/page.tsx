/* eslint-disable @next/next/no-img-element -- Artist-owned and expiring signed media must bypass the Vercel image optimizer. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instagram, MapPin, ShieldCheck } from "@/components/icons";
import { getApprovedArtists, getArtist } from "@/lib/data";
import { createSupabaseAdminClient, createSupabasePublicClient, hasSupabase } from "@/lib/supabase/server";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getApprovedArtists()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtist((await params).slug);
  if (!artist) return {};
  const state = artist.base_state || artist.states_served[0] || "Nigeria";
  const specialty = artist.categories[0] || "Artist";
  const description = artist.bio.length > 155 ? `${artist.bio.slice(0, 152)}…` : artist.bio;
  return {
    title: `${artist.business_name} | ${specialty} in ${state}, Nigeria`,
    description,
    openGraph: {
      title: `${artist.business_name} — Nigerian ${specialty}`,
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
  const whatsapp=artist.whatsapp.replace(/\D/g,"");const whatsappUrl=whatsapp.length>=10&&whatsapp.length<=15?`https://wa.me/${whatsapp}`:null;
  let reviews: Array<{id:string;overall:number;body:string;artist_response:string|null;created_at:string}> = [];
  let updates: Array<{id:string;caption:string;media_url:string;expires_at:string;isVideo?:boolean}> = [];
  if (hasSupabase) {
    const client = createSupabasePublicClient();
    const [reviewResult,updateResult] = await Promise.all([
      client.from("reviews").select("id,overall,body,artist_response,created_at").eq("artist_id",artist.id).eq("moderation_status","published").order("created_at",{ascending:false}).limit(12),
      client.from("artist_updates").select("id,caption,media_url,expires_at").eq("artist_id",artist.id).eq("visibility","public").eq("moderation_status","published").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}),
    ]);
    reviews=reviewResult.data||[]; updates=updateResult.data||[];
    if(updates.length){if(process.env.SUPABASE_SERVICE_ROLE_KEY){const admin=createSupabaseAdminClient();updates=await Promise.all(updates.map(async(update)=>{const isVideo=/\.(mp4|webm)$/i.test(update.media_url);const signed=await admin.storage.from("artist-updates").createSignedUrl(update.media_url,3600);return {...update,media_url:signed.data?.signedUrl||"",isVideo};}));updates=updates.filter(update=>Boolean(update.media_url));}else updates=[];}
  }
  const average = reviews.length ? reviews.reduce((sum,item)=>sum+item.overall,0)/reviews.length : null;
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
    ...(average ? { aggregateRating: { "@type":"AggregateRating", ratingValue:average.toFixed(1), reviewCount:reviews.length } } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="profile-hero"><div className="shell profile-grid">
      <div className="profile-photo">{artist.profile_image_url
        ? <img src={artist.profile_image_url} alt={`${artist.business_name} logo`} style={isLogo ? { objectFit: "contain", background: "#fff", padding: 36 } : undefined} />
        : <div className="artist-placeholder"><span>{initials}</span><small>{artist.owner_name}</small></div>}
      </div>
      <div>
        <p className="eyebrow"><ShieldCheck size={15} /> {artist.bookable === false ? "Researched Nigerian artist · profile unclaimed" : "Verified Nigerian artist · platform booking available"}</p>
        <h1 className="profile-title">{artist.business_name}</h1>
        <p className="location"><MapPin size={17} />{artist.states_served.join(" · ")}</p>
        <div className="chips">{artist.categories.map((category) => <span key={category}>{category}</span>)}</div>
        <p className="profile-bio">{artist.bio}</p>
        <div className="profile-meta">
          <div><small>Artist</small>{artist.owner_name}</div>
          <div><small>Typical price</small>{artist.price_range || "Ask for a quote"}</div>
          <div><small>Based / serves</small>{artist.states_served.join(", ")}</div>
          <div><small>Booking</small>{artist.bookable === false ? "Awaiting artist claim" : "Protected platform commission"}</div>
          {average && <div><small>Verified rating</small>{average.toFixed(1)} / 5 · {reviews.length} review{reviews.length===1?"":"s"}</div>}
        </div>
        <div className="profile-actions">
          <Link className="button" href={`/artist/${artist.slug}/book`}>{artist.bookable === false ? "Booking not open" : "Request a commission"}</Link>
          {artist.bookable === false && <Link className="button button-dark" href={`/artist/${artist.slug}/claim`}>Claim this profile</Link>}
          {artist.portfolio_link && <a className="button button-dark" href={artist.portfolio_link} target="_blank" rel="noopener">Visit Artist Website</a>}
          {whatsappUrl && <a className="text-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp enquiry</a>}
          {artist.instagram && <a className="text-link" href={artist.instagram} target="_blank" rel="noopener"><Instagram size={18} /> Instagram</a>}
        </div>
      </div>
    </div></section>
    {updates.length>0 && <section className="section process"><div className="shell"><div className="section-heading"><p className="eyebrow">Available for 24 hours</p><h2>Work in Progress</h2></div><div className="status-grid">{updates.map(update=><article className="status-card" key={update.id}>{update.isVideo?<video src={update.media_url} controls preload="metadata"/>:<img src={update.media_url} alt="Artist work in progress" />}<p>{update.caption}</p><small>Expires {new Date(update.expires_at).toLocaleString("en-NG")}</small></article>)}</div></div></section>}
    {artist.portfolio_image_urls.length > 0 && <section className="section process"><div className="shell">
      <div className="section-heading"><p className="eyebrow">Original artwork</p><h2>{artist.business_name} Portfolio</h2></div>
      <div className="portfolio-grid">{artist.portfolio_image_urls.map((url, index) => <img src={url} alt={`${artist.business_name} portrait artwork ${index + 1}`} key={url} />)}</div>
    </div></section>}
    {reviews.length>0 && <section className="section"><div className="shell"><div className="section-heading"><p className="eyebrow">Paid bookings only</p><h2>Verified Commission Reviews</h2></div><div className="review-grid">{reviews.map(review=><article className="review-card" key={review.id}><strong>{"★".repeat(review.overall)}{"☆".repeat(5-review.overall)}</strong><p>{review.body}</p>{review.artist_response&&<div><small>Artist response</small><p>{review.artist_response}</p></div>}</article>)}</div></div></section>}
    <section className="cta-band"><div className="shell"><div><p className="eyebrow eyebrow-light">Find local creatives</p><h2>Browse More Nigerian Artists</h2></div><div><p>Compare claimed profiles, commission terms and verified booking reviews.</p><Link className="button button-light" href="/find-artists">Browse Nigerian Artists</Link></div></div></section>
  </>;
}
