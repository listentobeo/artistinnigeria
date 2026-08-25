import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/auth";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  let currentEmail = "";
  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (isAdminUser(user)) redirect("/admin");
    currentEmail = user?.email || "";
  }
  return <section className="auth-shell"><div className="auth-card">
    <p className="eyebrow">Private dashboard</p><h1>Administrator sign in</h1>
    <p>Only an account with the protected administrator role can open operations.</p>
    {currentEmail && <div className="status-message error">Signed in as {currentEmail}, but this session is not an administrator session. Sign out or sign in again after assigning the role.</div>}
    <LoginForm initialError={query.error} />
    {currentEmail && <form action="/auth/sign-out" method="post"><button className="text-link nav-text-button" type="submit">Sign out current account</button></form>}
  </div></section>;
}
