import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/auth";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { safeRelativePath } from "@/lib/navigation";
import { signIn } from "../actions";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const query = await searchParams;
  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(isAdminUser(user) ? "/admin" : safeRelativePath(query.next));
  }
  return <section className="auth-shell"><form className="auth-card" action={signIn}>
    <p className="eyebrow">Secure account</p><h1>Welcome back</h1><p>Manage commissions, progress, payments and reviews in one place.</p>
    {query.message && <div className="status-message">{query.message}</div>}{query.error && <div className="status-message error">{query.error}</div>}
    <input type="hidden" name="next" value={query.next||"/dashboard"}/>
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
    <button className="button" type="submit">Sign in</button>
    <p className="help-text">New here? <Link className="text-link" href={`/auth/sign-up?next=${encodeURIComponent(query.next||"/dashboard")}`}>Create an account</Link></p>
  </form></section>;
}
