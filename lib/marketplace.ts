import type { BookingStatus } from "./types";

export const PLATFORM_COMMISSION_BPS = 1000;

export function calculateBookingMoney(commissionableKobo: number, reimbursableKobo = 0) {
  if (!Number.isSafeInteger(commissionableKobo) || commissionableKobo < 0) throw new Error("Invalid commissionable amount");
  if (!Number.isSafeInteger(reimbursableKobo) || reimbursableKobo < 0) throw new Error("Invalid reimbursable amount");
  const platformFeeKobo = Math.round(commissionableKobo * PLATFORM_COMMISSION_BPS / 10_000);
  return {
    commissionableKobo, reimbursableKobo, platformFeeKobo,
    artistEntitlementKobo: commissionableKobo - platformFeeKobo + reimbursableKobo,
    customerTotalKobo: commissionableKobo + reimbursableKobo,
  };
}

export const allowedBookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  draft: ["submitted", "cancelled"], submitted: ["artist_reviewing", "cancelled"],
  artist_reviewing: ["quoted", "cancelled"], quoted: ["quote_accepted", "cancelled"],
  quote_accepted: ["payment_pending", "cancelled"], payment_pending: ["funded", "cancelled"],
  funded: ["in_progress", "refund_pending", "disputed"],
  in_progress: ["awaiting_client_approval", "revision_requested", "disputed"],
  awaiting_client_approval: ["completed", "revision_requested", "disputed"],
  revision_requested: ["in_progress", "awaiting_client_approval", "disputed"],
  completed: ["disputed"], disputed: ["completed", "refund_pending"],
  cancelled: [], refund_pending: ["refunded"], refunded: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return allowedBookingTransitions[from].includes(to);
}

export function normalizeExternalUrl(value: unknown) {
  const raw=String(value||"").trim();if(!raw)return null;if(raw.length>500)throw new Error("External links must be under 500 characters.");let parsed:URL;try{parsed=new URL(raw);}catch{throw new Error("Enter a complete https:// website address.");}if(!["http:","https:"].includes(parsed.protocol))throw new Error("Only HTTP or HTTPS links are allowed.");return parsed.toString();
}

export function normalizeInstagram(value: unknown) {
  const raw=String(value||"").trim();if(!raw)return null;if(/^@?[A-Za-z0-9._]{1,30}$/.test(raw))return `https://instagram.com/${raw.replace(/^@/,"")}`;const url=normalizeExternalUrl(raw);if(!url||new URL(url).hostname.replace(/^www\./,"")!=="instagram.com")throw new Error("Enter an Instagram handle or instagram.com link.");return url;
}

export function normalizeWhatsapp(value: unknown) {
  const digits=String(value||"").replace(/\D/g,"");if(digits.length<10||digits.length>15)throw new Error("Enter a valid WhatsApp number including country code.");return digits;
}

export const serviceBriefs: Record<string, { label: string; fields: string[] }> = {
  Portrait: { label: "Portrait commission", fields: ["subjects", "medium", "dimensions", "reference_photos", "background", "framing", "deadline", "delivery_state"] },
  Mural: { label: "Mural project", fields: ["wall_photos", "wall_dimensions", "indoor_or_outdoor", "surface_condition", "project_address", "concept", "brand_colours", "access_and_scaffolding", "installation_date"] },
  "Sculpture & Carving": { label: "Sculpture or carving", fields: ["material", "dimensions", "indoor_or_outdoor", "concept", "site_photos", "foundation", "finish", "transport", "installation"] },
  "Live Event Painting": { label: "Live event painting", fields: ["event_type", "event_date", "venue", "key_moment", "canvas_size", "medium", "service_hours", "travel_and_accommodation"] },
  "SFX & Makeup": { label: "SFX makeup", fields: ["production_type", "effect", "date", "location", "performer_count", "body_area", "allergies", "continuity_days", "call_time", "private_references"] },
  "Fabric & Textile": { label: "Fabric and textile work", fields: ["technique", "garment_or_fabric", "measurements", "quantity", "colours", "pattern", "base_material", "sample_approval", "care_requirements"] },
  "Abstract & Contemporary": { label: "Abstract or contemporary work", fields: ["dimensions", "medium", "palette", "room_photos", "concept", "framing", "mockup", "shipping", "installation"] },
};
