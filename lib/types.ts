export type ArtistStatus = "pending" | "approved" | "rejected";

export type VerificationState = "researched" | "contacted" | "claimed" | "identity_verified" | "portfolio_approved" | "payment_ready" | "suspended";

export type Artist = {
  id: string;
  slug: string;
  business_name: string;
  owner_name: string;
  email?: string;
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
  owner_user_id?: string | null;
  verification_state?: VerificationState;
  bookable?: boolean;
  base_state?: string | null;
  public_address?: string | null;
  paystack_recipient_code?: string | null;
  response_time_hours?: number | null;
  moderation_reason?: string | null;
};

export type NigerianState = { name: string; slug: string };

export type AppRole = "customer" | "artist" | "support" | "admin";

export type BookingStatus =
  | "draft" | "submitted" | "artist_reviewing" | "quoted" | "quote_accepted"
  | "payment_pending" | "funded" | "in_progress" | "awaiting_client_approval"
  | "revision_requested" | "completed" | "disputed" | "cancelled"
  | "refund_pending" | "refunded";

export type StateContent = {
  state_slug: string;
  capital: string;
  major_cities: string[];
  map_query: string;
  local_summary: string;
  source_urls: string[];
  last_verified_at: string;
};
