import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistCard } from "@/components/artist-card";
import { LocationMap } from "@/components/location-map";
import { ArrowRight, MapPin } from "@/components/icons";
import { artistCategories, categoryHubUrl, categoryStateUrl } from "@/lib/categories";
import { getArtistsForCategoryState, getStates } from "@/lib/data";
import { serviceHiringNotes, serviceResearchSources, stateContent } from "@/lib/state-content";

export const revalidate = 60;
type Props = { params: Promise<{ directoryRoute: string }> };

async function parseRoute(route: string) {
  const category = artistCategories.find((item) => route.startsWith(`${item.slug}-artist-in-`));
  if (!category) return null;
  const locationSlug = route.slice(`${category.slug}-artist-in-`.length);
  if (locationSlug === "nigeria") return { category, state: null, isHub: true };
  const state = (await getStates()).find((item) => item.slug === locationSlug);
  if (!state) return null;
  return { category, state, isHub: false };
}

export async function generateStaticParams() {
  const states = await getStates();
  return artistCategories.flatMap((category) => [
    { directoryRoute: `${category.slug}-artist-in-nigeria` },
    ...states.map((state) => ({ directoryRoute: `${category.slug}-artist-in-${state.slug}` })),
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = await parseRoute((await params).directoryRoute);
  if (!parsed) return {};
  if (parsed.isHub) {
    return {
      title: { absolute: `${parsed.category.displayName} in Nigeria | Find by State` },
      description: `Find ${parsed.category.displayName.toLowerCase()} across all 36 Nigerian states and the FCT. Compare genuine profiles and request managed art commissions.`,
    };
  }
  const state = parsed.state!;
  const artists = await getArtistsForCategoryState(parsed.category, state.name);
  const hasBookableArtist = artists.some((artist) => artist.bookable !== false);
  return {
    title: { absolute: `${parsed.category.displayName} in ${state.name}, Nigeria | Local ${parsed.category.displayName} Near You` },
    description: artists.length
      ? `Browse ${artists.length} approved ${parsed.category.displayName.toLowerCase()} serving ${state.name}, Nigeria. Compare portfolios and request a protected platform commission.`
      : `Find ${parsed.category.displayName.toLowerCase()} serving ${state.name}, Nigeria. Explore local creative services, nearby states and verified artist profiles.`,
    robots: hasBookableArtist ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function DirectoryRoutePage({ params }: Props) {
  const parsed = await parseRoute((await params).directoryRoute);
  if (!parsed) notFound();
  const states = await getStates();

  if (parsed.isHub) {
    const { category } = parsed;
    return <>
      <section className="page-hero directory-page-hero"><div className="shell directory-hero-grid"><div className="directory-hero-copy">
        <p className="eyebrow"><MapPin size={15} /> Browse Nigerian artists by state</p>
        <h1>{category.displayName}<br />in Nigeria</h1>
        <p>Find professional Nigerian creatives specializing in {category.description}. Choose a state to compare genuine profiles, portfolios and platform booking availability.</p>
      </div><div className="directory-hero-image"><Image src={category.heroImages[0]} alt={`${category.displayName} working in Nigeria`} fill priority sizes="(max-width: 850px) 100vw, 46vw" /></div></div></section>
      <section className="section"><div className="shell">
        <div className="section-heading"><p className="eyebrow">All 36 states + FCT</p><h2>Find {category.displayName} Near You</h2><p>Select your location to see approved artists serving that part of Nigeria.</p></div>
        <div className="state-grid">{states.map((state) => <Link className="state-link" key={state.slug} href={categoryStateUrl(category, state.slug)}><span>{state.name}</span><ArrowRight size={16} /></Link>)}</div>
      </div></section>
    </>;
  }

  const { category, state } = parsed;
  const artists = await getArtistsForCategoryState(category, state!.name);
  const bookableArtists = artists.filter((artist)=>artist.bookable !== false);
  const location = stateContent[state!.slug];
  const otherCategories = artistCategories.filter((item) => item.slug !== category.slug);
  const stateIndex = states.findIndex((item) => item.slug === state!.slug);
  const heroImage = category.heroImages[Math.max(stateIndex, 0) % category.heroImages.length];
  const jsonLd = bookableArtists.map((artist) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: artist.business_name,
    description: artist.bio,
    image: artist.profile_image_url,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://artistinnigeria.com"}/artist/${artist.slug}`,
    areaServed: state!.name,
    priceRange: artist.price_range,
  }));

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="page-hero directory-page-hero"><div className="shell directory-hero-grid"><div className="directory-hero-copy">
      <p className="eyebrow"><MapPin size={15} /> Local {category.singular.toLowerCase()} directory</p>
      <h1>{category.displayName} in<br />{state!.name}, Nigeria</h1>
      <p>Find researched and verified {category.displayName.toLowerCase()} serving {state!.name}. Compare portfolios and request a managed commission for {category.description}.</p>
    </div><div className="directory-hero-image"><Image src={heroImage} alt={`${category.singular} serving ${state!.name}, Nigeria`} fill priority sizes="(max-width: 850px) 100vw, 46vw" /></div></div></section>
    <section className="section"><div className="shell">
      <div className="section-heading"><p className="eyebrow">Local and travelling professionals</p><h2>{category.displayName} Serving {state!.name}</h2><p>{bookableArtists.length} currently verified for platform booking. Researched profiles remain clearly marked until claimed.</p></div>
      {artists.length ? <div className="artist-grid">{artists.map((artist) => <ArtistCard artist={artist} key={artist.id} />)}</div> : <div className="empty-state"><h3>More local profiles are coming soon</h3><p>We’re currently onboarding {category.displayName.toLowerCase()} in {state!.name}. Explore other categories below or check nearby states.</p><Link className="button" href="/apply">Apply to Be Listed <ArrowRight size={17} /></Link></div>}
      <div className="section-heading" style={{ marginTop: 90 }}><p className="eyebrow">Commission with confidence</p><h2>How to Book a {category.singular} in {state!.name}</h2><p>{serviceHiringNotes[category.slug]} Artist in Nigeria keeps the accepted quote, payment, progress, revisions and delivery record inside the booking.</p>{serviceResearchSources[category.slug]&&<small>Service workflow reference: <a className="text-link" href={serviceResearchSources[category.slug].url} target="_blank" rel="noopener">{serviceResearchSources[category.slug].label}</a></small>}</div>
      {location && <section className="local-context"><div><p className="eyebrow">Location planning</p><h2>{category.displayName} around {location.capital}</h2><p>{location.local_summary}</p><p><strong>Places covered in this location guide:</strong> {location.major_cities.join(", ")}.</p><small>Location reference checked {location.last_verified_at}. <a className="text-link" href={location.source_urls[0]} target="_blank" rel="noopener">Open map source</a></small></div><LocationMap query={location.map_query} label={`${state!.name}, Nigeria`} /></section>}
      <div className="section-heading" style={{ marginTop: 90, marginBottom: 28 }}><p className="eyebrow">Explore more creative services</p><h2>Browse Other Artists in {state!.name}</h2></div>
      <div className="category-link-grid">{otherCategories.map((item) => <Link className="state-link" key={item.slug} href={categoryStateUrl(item, state!.slug)}><span>{item.displayName}</span><ArrowRight size={16} /></Link>)}</div>
      <p style={{ marginTop: 32 }}><Link className="text-link" href={categoryHubUrl(category)}>Browse {category.displayName} in Other States</Link></p>
    </div></section>
  </>;
}
