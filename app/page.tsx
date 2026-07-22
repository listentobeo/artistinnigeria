import Link from "next/link";
import Image from "next/image";
import { ArtistCard } from "@/components/artist-card";
import { ArrowRight, Check, MapPin, Palette, ShieldCheck, Sparkles } from "@/components/icons";
import { HomeTabs } from "@/components/home-tabs";
import { faqs } from "@/lib/constants";
import { getApprovedArtists } from "@/lib/data";
import { artistCategories, categoryHubUrl } from "@/lib/categories";
import type { Metadata } from "next";
import styles from "./hero-art.module.css";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Local Artists and Painters in Nigeria | Find Artists Near You",
  description: "Find local artists and painters near you in Nigeria for portraits, murals, live painting and custom artwork. Browse verified Nigerian artist portfolios.",
};

export default async function Home() {
  const artists = await getApprovedArtists();
  return <>
    <section className="hero"><div className="shell hero-grid"><div className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> Nigeria’s local artist directory</p><h1>Find Local Artists<br /><em>and Painters in Nigeria</em></h1><p className="hero-lead">Find verified artists near you for custom portraits, murals, live event painting and original Nigerian artwork. Browse portfolios and contact artists directly.</p><div className="hero-actions"><Link className="button" href="/find-artists">Find Artists Near You <ArrowRight size={18} /></Link><Link className="text-link" href="/apply">List Your Art Business</Link></div><div className="trust-row"><span><ShieldCheck size={18} /> Personally verified</span><span><MapPin size={18} /> All 36 states + FCT</span></div></div><div className="hero-art"><div className="frame frame-back" aria-hidden="true"><span>Made<br />in<br />Nigeria</span></div><div className="frame frame-front"><div className={`portrait-shape ${styles.artwork}`}><Image src="/hero-nigerian-portrait-artwork.png" alt="Contemporary Nigerian portrait painting" fill priority sizes="(max-width: 600px) 190px, 270px" /></div><p>Art with a story</p></div></div></div></section>
    <section className="marquee"><p>Portraits <i>✦</i> Murals <i>✦</i> Live painting <i>✦</i> Contemporary art <i>✦</i> Sculpture <i>✦</i> Textile art</p></section>
    <section className="section" id="artists"><div className="shell"><div className="section-heading split"><div><p className="eyebrow">Verified Nigerian creatives</p><h2>Featured Nigerian Artists and Portrait Painters</h2></div><Link className="text-link" href="/portrait-artist-in-nigeria">Browse All Nigerian Artists <ArrowRight size={17} /></Link></div><div className="artist-grid">{artists.slice(0, 3).map((artist) => <ArtistCard artist={artist} key={artist.id} />)}<Link href="/apply" className="join-card"><Palette size={32} /><h3>List Your Art Business in Nigeria</h3><p>Create an artist profile and reach clients searching for local painters and creatives.</p><span>Apply to Join <ArrowRight size={17} /></span></Link></div></div></section>
    <section className="section category-section"><div className="shell"><div className="section-heading centered"><p className="eyebrow">Browse by creative service</p><h2>Find the Right Type of Artist in Nigeria</h2><p>Choose an art category, then browse approved artists by state.</p></div><div className="category-card-grid">{artistCategories.map((category, index) => <Link className="category-card" href={categoryHubUrl(category)} key={category.slug}><span>{String(index + 1).padStart(2, "0")}</span><h3>{category.displayName}</h3><p>{category.description}</p><strong>Browse by state <ArrowRight size={16} /></strong></Link>)}</div></div></section>
    <section className="section process" id="how"><div className="shell narrow"><div className="section-heading centered"><p className="eyebrow">Find the right creative</p><h2>How to Find and Hire an Artist in Nigeria</h2><p>Search by location, compare portfolios and contact a verified Nigerian artist directly.</p></div><HomeTabs /></div></section>
    <section className="find-band"><div className="shell"><div><p className="eyebrow eyebrow-light">Search by category and location</p><h2>Find Artists Near You Across Nigeria</h2></div><Link className="button button-light" href="/find-artists">Find Artists Near You <ArrowRight size={18} /></Link></div></section>
    <section className="section faq" id="faq"><div className="shell narrow"><div className="section-heading centered"><p className="eyebrow">Artist hiring guide</p><h2>Questions About Hiring Nigerian Artists</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>
    <section className="cta-band"><div className="shell"><div><p className="eyebrow eyebrow-light">For Nigerian creatives</p><h2>Are You an Artist in Nigeria? List Your Work</h2></div><div><p>Join a curated Nigerian artist directory built to connect professional creatives with local clients and art buyers.</p><Link className="button button-light" href="/apply">Create Your Artist Profile <ArrowRight size={18} /></Link></div></div></section>
  </>;
}
