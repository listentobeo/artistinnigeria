export type ArtistStatus = "pending" | "approved" | "rejected";

export type Artist = {
  id: string;
  slug: string;
  business_name: string;
  owner_name: string;
  email: string;
  whatsapp: string;
  bio: string;
  categories: string[];
  states_served: string[];
  profile_image_url: string | null;
  portfolio_image_urls: string[];
  instagram: string | null;
  portfolio_link: string | null;
  price_range: string | null;
  status: ArtistStatus;
  featured: boolean;
  featured_until: string | null;
  featured_tier: string | null;
  created_at: string;
  updated_at: string;
};

export type NigerianState = { name: string; slug: string };
