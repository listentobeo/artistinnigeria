export type ArtistCategory = {
  slug: string;
  displayName: string;
  singular: string;
  databaseValue: string;
  description: string;
  heroImages: string[];
};

export const artistCategories: ArtistCategory[] = [
  { slug: "portrait", displayName: "Portrait Artists", singular: "Portrait Artist", databaseValue: "Portrait", description: "commissioned pencil, charcoal, acrylic and oil portraits", heroImages: ["/portrait artist female.png"] },
  { slug: "mural", displayName: "Muralists", singular: "Muralist", databaseValue: "Mural", description: "indoor, outdoor, commercial and public murals", heroImages: ["/mural artist male.png", "/mural artist female.png"] },
  { slug: "sculpture", displayName: "Sculptors & Carvers", singular: "Sculptor", databaseValue: "Sculpture & Carving", description: "original sculpture, carving and three-dimensional artwork", heroImages: ["/scluptors in nigeria.png"] },
  { slug: "live-event-painting", displayName: "Live Event Painters", singular: "Live Event Painter", databaseValue: "Live Event Painting", description: "live wedding, corporate and special-event paintings", heroImages: ["/live painter.png", "/livepainter.png"] },
  { slug: "sfx-makeup", displayName: "SFX & Makeup Artists", singular: "SFX Makeup Artist", databaseValue: "SFX & Makeup", description: "special-effects makeup and creative makeup artistry", heroImages: ["/sfx makeup artist.png"] },
  { slug: "fabric-textile", displayName: "Fabric & Textile Artists", singular: "Fabric & Textile Artist", databaseValue: "Fabric & Textile", description: "handmade fabric, textile and wearable artwork", heroImages: ["/fabric art.png"] },
  { slug: "abstract-contemporary", displayName: "Abstract & Contemporary Artists", singular: "Abstract Artist", databaseValue: "Abstract & Contemporary", description: "abstract, modern and contemporary Nigerian art", heroImages: ["/abstract artist in nigeria.png"] },
];

export function getArtistCategory(slug: string) {
  return artistCategories.find((category) => category.slug === slug);
}

export function categoryHubUrl(category: ArtistCategory) {
  return `/${category.slug}-artist-in-nigeria`;
}

export function categoryStateUrl(category: ArtistCategory, stateSlug: string) {
  return `/${category.slug}-artist-in-${stateSlug}`;
}

export function isActiveFeatured(featured: boolean, featuredUntil: string | null) {
  return featured && (!featuredUntil || new Date(featuredUntil).getTime() > Date.now());
}
