import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasSupabase, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types";
import { moderateArtist, signOut, updateFeaturedPlacement } from "./actions";

export const metadata: Metadata = { title: "Artist approvals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function FeaturedFields({ artist }: { artist?: Artist }) {
  const date = artist?.featured_until ? artist.featured_until.slice(0, 10) : "";
  return <div className="featured-controls"><label className="choice"><input type="checkbox" name="featured" defaultChecked={artist?.featured || false} /> Featured nationwide placement</label><div className="field-grid"><div className="field"><label>Featured tier</label><select name="featured_tier" defaultValue={artist?.featured_tier || "monthly"}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="manual">Manual</option><option value="owner">Owner</option></select></div><div className="field"><label>Featured until</label><input type="date" name="featured_until" defaultValue={date} /><p className="help-text">Leave empty for no expiry.</p></div></div></div>;
}

function Portfolio({ artist }: { artist: Artist }) {
  if (!artist.portfolio_image_urls.length) return null;
  return <div className="portfolio-grid" style={{ marginTop: 20 }}>{artist.portfolio_image_urls.map((url) => <a href={url} target="_blank" key={url}><img src={url} alt="Submitted portfolio" /></a>)}</div>;
}

export default async function AdminPage() {
  if (!hasSupabase) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("artists").select("*").in("status", ["pending", "approved"]).order("created_at", { ascending: true });
  const artists = (data || []) as Artist[];
  const pending = artists.filter((artist) => artist.status === "pending");
  const approved = artists.filter((artist) => artist.status === "approved");

  return <section className="admin-shell">
    <div className="admin-heading"><div><p className="eyebrow">Private moderation dashboard</p><h1>Artist applications</h1><p>{pending.length} waiting for review</p></div><form action={signOut}><button className="button reject">Sign out</button></form></div>
    <div className="section-heading"><h2>Pending Applications</h2></div>
    {pending.length === 0 ? <div className="empty-state"><h3>You’re all caught up.</h3><p>New artist applications will appear here.</p></div> : <div className="admin-list">{pending.map((artist) => <article className="admin-card" key={artist.id}><div><h2>{artist.business_name}</h2><p><strong>{artist.owner_name}</strong> · {artist.email} · {artist.whatsapp}</p><p>{artist.bio}</p><div className="chips">{artist.categories.map((item) => <span key={item}>{item}</span>)}{artist.states_served.map((item) => <span key={item}>{item}</span>)}</div><Portfolio artist={artist} /></div><div><form action={moderateArtist}><input type="hidden" name="id" value={artist.id} /><input type="hidden" name="status" value="approved" /><FeaturedFields /><button className="button">Approve Artist</button></form><form action={moderateArtist} style={{ marginTop: 8 }}><input type="hidden" name="id" value={artist.id} /><input type="hidden" name="status" value="rejected" /><button className="button reject">Reject</button></form></div></article>)}</div>}
    <div className="section-heading" style={{ marginTop: 80 }}><h2>Approved Artist Placement</h2><p>Featured placement overrides normal categories and states until it expires.</p></div>
    <div className="admin-list">{approved.map((artist) => <article className="admin-card" key={artist.id}><div><h2>{artist.business_name}</h2><p>{artist.categories.join(" · ")}<br />{artist.states_served.join(" · ")}</p></div><form action={updateFeaturedPlacement}><input type="hidden" name="id" value={artist.id} /><FeaturedFields artist={artist} /><button className="button">Save Placement</button></form></article>)}</div>
  </section>;
}
