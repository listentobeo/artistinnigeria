import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { signOutAccount } from "@/app/auth/actions";
import { resubmitArtistApplication } from "./artist-actions";

export const metadata = { title: "Account dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabase) return <section className="admin-shell"><div className="empty-state"><h1>Account preview</h1><p>Supabase environment variables are not available locally. The account dashboard activates automatically when they are configured on Vercel.</p><Link className="button" href="/find-artists">Browse the public marketplace</Link></div></section>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const [{ data: profile }, { data: ownedArtist }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("artists").select("id,slug,business_name,status,verification_state,bookable,moderation_reason").eq("owner_user_id", user.id).maybeSingle(),
  ]);
  const artistId = ownedArtist?.id;
  const { data: requests } = artistId
    ? await supabase.from("commission_requests").select("id,title,category,created_at").eq("artist_id",artistId).order("created_at",{ascending:false})
    : await supabase.from("commission_requests").select("id,title,category,created_at,artists(business_name)").eq("customer_id",user.id).order("created_at",{ascending:false});
  const { data: bookings } = artistId
    ? await supabase.from("bookings").select("id,status,customer_total_kobo,currency,created_at,commission_requests(title)").eq("artist_id", artistId).order("created_at", { ascending: false })
    : await supabase.from("bookings").select("id,status,customer_total_kobo,currency,created_at,artists(business_name),commission_requests(title)").eq("customer_id", user.id).order("created_at", { ascending: false });
  return <section className="admin-shell">
    <div className="admin-heading"><div><p className="eyebrow">{ownedArtist ? "Artist workspace" : "Customer workspace"}</p><h1>{profile?.full_name || user.email}</h1><p>{ownedArtist ? `${ownedArtist.business_name} · ${ownedArtist.verification_state}` : "Your commission requests and payments"}</p></div><form action={signOutAccount}><button className="button reject">Sign out</button></form></div>
    {ownedArtist?.status==="rejected"&&<div className="status-message error"><strong>Application needs changes:</strong> {ownedArtist.moderation_reason||"Update your profile before resubmitting."}</div>}
    {ownedArtist && <div className="dashboard-actions">{ownedArtist.status==="approved"&&<Link className="button" href={`/artist/${ownedArtist.slug}`}>View public profile</Link>}<Link className="button button-dark" href="/dashboard/profile">Edit artist profile</Link>{ownedArtist.status==="approved"&&<Link className="button button-dark" href="/dashboard/status">Post 24-hour update</Link>}{ownedArtist.status==="rejected"&&<form action={resubmitArtistApplication}><button className="button">Resubmit for review</button></form>}</div>}
    <div className="section-heading" style={{ marginTop: 60 }}><p className="eyebrow">Before payment</p><h2>Requests and quotes</h2></div>
    {!requests?.length ? <div className="empty-state"><p>No open requests yet.</p></div> : <div className="booking-list">{requests.map((request: any) => <Link className="booking-row" href={`/requests/${request.id}`} key={request.id}><div><strong>{request.title}</strong><small>{request.artists?.business_name || request.category}</small></div><span className="status-pill">Open request</span></Link>)}</div>}
    <div className="section-heading" style={{ marginTop: 60 }}><p className="eyebrow">Protected workspace</p><h2>{ownedArtist ? "Commission requests" : "Your commissions"}</h2></div>
    {!bookings?.length ? <div className="empty-state"><h3>No commissions yet</h3><p>{ownedArtist ? "New customer requests will appear here." : "Choose a bookable artist and send your first commission brief."}</p>{!ownedArtist && <Link className="button" href="/find-artists">Find an artist</Link>}</div> : <div className="booking-list">{bookings.map((booking: any) => <Link className="booking-row" href={`/bookings/${booking.id}`} key={booking.id}><div><strong>{booking.commission_requests?.title || "Commission"}</strong><small>{booking.artists?.business_name || ownedArtist?.business_name}</small></div><span className="status-pill">{String(booking.status).replaceAll("_", " ")}</span><strong>{new Intl.NumberFormat("en-NG",{style:"currency",currency:booking.currency||"NGN"}).format(booking.customer_total_kobo/100)}</strong></Link>)}</div>}
  </section>;
}
