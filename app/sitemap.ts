import type { MetadataRoute } from "next";
import { artistCategories, categoryHubUrl, categoryStateUrl } from "@/lib/categories";
import { getApprovedArtists, getStates } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://artistinnigeria.com").replace(/\/$/,"");
  const [artists, states] = await Promise.all([getApprovedArtists(), getStates()]);
  const categoryPages = artistCategories.flatMap((category) => [
    { url: `${base}${categoryHubUrl(category)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    ...states.filter((state)=>artists.some((artist)=>artist.bookable!==false&&artist.states_served.some(value=>value.toLowerCase()===state.name.toLowerCase())&&artist.categories.some(value=>value.toLowerCase()===category.databaseValue.toLowerCase()))).map((state) => ({ url: `${base}${categoryStateUrl(category, state.slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 })),
  ]);
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/find-artists`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/apply`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...categoryPages,
    ...artists.map((artist) => ({ url: `${base}/artist/${artist.slug}`, lastModified: new Date(artist.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
