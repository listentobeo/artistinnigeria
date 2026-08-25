"use client";

import { FormEvent, useState } from "react";
import { isAdminUser } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("Add Supabase environment variables to enable admin login.");
      setLoading(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut();
      setError("This login is valid, but the account has customer access. Run the owner administrator migration in Supabase, then sign in again.");
      setLoading(false);
      return;
    }
    window.location.href = "/admin";
  }

  return <form onSubmit={submit}>
    <div className="field"><label htmlFor="admin-email">Email</label><input id="admin-email" type="email" name="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" name="password" autoComplete="current-password" required /></div>
    {error && <div className="status-message error">{error}</div>}
    <button className="button" disabled={loading}>{loading ? "Signing in…" : "Sign in as administrator"}</button>
  </form>;
}
