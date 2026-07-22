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
};

export const faqs = [
  ["How do I commission an artist in Nigeria?", "Browse verified profiles, compare portfolios and prices, then contact your chosen artist directly via WhatsApp. Share your idea, agree on the scope, price and timeline, and the artist can begin."],
  ["How much does a custom portrait cost in Nigeria?", "Prices vary by medium, size, number of subjects and experience. A pencil sketch may start around ₦30,000, while a large oil painting can cost ₦500,000 or more."],
  ["Do Nigerian artists ship internationally?", "Yes. Many artists offer secure worldwide shipping to the UK, USA, Canada, France and beyond. Confirm delivery options and costs directly with the artist."],
  ["How are artists verified?", "Every application is reviewed before publication. We check the artist’s identity, portfolio quality, contact details and professional presentation."],
];
