import type { Artist, NigerianState } from "./types";

const names = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT Abuja",
];

export const states: NigerianState[] = names.map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

export const categories = [
  "Portrait", "Mural", "Live Event Painting", "Abstract & Contemporary", "SFX & Makeup",
  "Fabric & Textile", "Sculpture & Carving",
];

export const featuredArtist: Artist = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "beo-art-studio",
  business_name: "Beo Art Studio",
  owner_name: "Benjamin Odeke",
  email: "hello@beoarts.com",
  whatsapp: "2349075424681",
  bio: "Beo Art Studio is a full-service Nigerian art brand creating story-driven custom portraits, large-scale murals, live event paintings, SFX makeup, and fabric art for clients across Nigeria and worldwide.",
  categories: ["Portrait", "Mural", "Live Event Painting", "SFX & Makeup", "Fabric & Textile"],
  states_served: ["Bayelsa", "Lagos", "Rivers", "FCT Abuja"],
  profile_image_url: "/beo-art-studio-logo.png",
  portfolio_image_urls: [],
  instagram: "https://instagram.com/_beoarts",
  portfolio_link: "https://www.beoarts.com/p/beo-art-studio-gallery-browse-our.html",
  price_range: "₦30,000 – ₦500,000+",
  status: "approved",
  featured: true,
  featured_until: null,
  featured_tier: "owner",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  verification_state: "payment_ready",
  bookable: true,
  base_state: "Bayelsa",
};

export const faqs = [
  ["How do I commission an artist in Nigeria?", "Choose a bookable artist, send the category-specific project brief and review the artist’s written quote. Once you accept the deliverables, timing, revisions and rights, you can pay through Paystack and manage the work from your account."],
  ["How much does a custom portrait cost in Nigeria?", "Portrait pricing depends on medium, dimensions, number of subjects, framing, delivery and the artist’s experience. The artist provides an itemised written quote before you make any payment."],
  ["Can I book a Nigerian artist from outside Nigeria?", "You can submit a commission request from abroad. Card acceptance, currency conversion, shipping availability and import costs depend on your bank, Paystack availability, the artist’s quote and the destination."],
  ["How are artists verified?", "Researched profiles are clearly marked, cannot take bookings and must be claimed by the artist. Booking opens only after ownership, identity, portfolio and payout details have been reviewed by the platform."],
  ["What does the 10% platform commission cover?", "The artist’s quote shows the artwork subtotal and separate reimbursable costs. Artist in Nigeria retains 10% of the artistic commission subtotal for the managed booking, payment record, communication, dispute and review workflow."],
];
