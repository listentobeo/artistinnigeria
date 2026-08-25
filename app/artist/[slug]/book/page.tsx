import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtist } from "@/lib/data";
import { CommissionForm } from "./commission-form";

export const metadata = { title: "Request a commission", robots: { index: false, follow: false } };
export default async function BookArtistPage({ params }: { params: Promise<{slug:string}> }) {
  const artist = await getArtist((await params).slug); if (!artist) notFound();
  if (artist.bookable === false) return <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Profile awaiting claim</p><h1>{artist.business_name} is not accepting platform bookings yet</h1><p>This researched profile must be claimed and payment-verified by the artist before customers can pay through Artist in Nigeria.</p><Link className="button" href={`/artist/${artist.slug}`}>Return to profile</Link></div></section>;
  return <section className="form-page"><div className="form-layout narrow"><div className="form-intro"><p className="eyebrow">Managed commission</p><h1>Work with {artist.business_name}</h1><p>Send a complete brief. The artist can respond with a written quote covering price, timing, revisions and delivery before you pay.</p><ul className="form-points"><li>✓ No payment before a written quote</li><li>✓ Booking-scoped progress and messages</li><li>✓ Verified reviews after completed work</li></ul></div><CommissionForm artistId={artist.id} artistName={artist.business_name} categories={artist.categories} /></div></section>;
}
