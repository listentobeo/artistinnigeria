"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { safeRelativePath } from "@/lib/navigation";
import { isAdminUser } from "@/lib/auth";

function configured() { if (!hasSupabase) throw new Error("Accounts are not connected in this preview. Configure Supabase on Vercel first."); }

export async function signIn(formData: FormData) {
  configured();
  const supabase = await createSupabaseServerClient();
  const next=safeRelativePath(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") || "").trim(), password: String(formData.get("password") || "") });
  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  if (next.startsWith("/admin") && !isAdminUser(data.user)) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=${encodeURIComponent("This account is signed in, but it has not been assigned the administrator role.")}`);
  }
  redirect(isAdminUser(data.user) && next === "/dashboard" ? "/admin" : next);
}

export async function signUp(formData: FormData) {
  configured();
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const next = safeRelativePath(formData.get("next"));if(fullName.length<2||fullName.length>120||!/^\S+@\S+\.\S+$/.test(email)||password.length<8)redirect(`/auth/sign-up?error=${encodeURIComponent("Enter a valid name, email and password of at least eight characters.")}&next=${encodeURIComponent(next)}`);const site=new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").origin;
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${site}/auth/confirm?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(`/auth/login?message=${encodeURIComponent("Check your email to confirm your account, then sign in.")}&next=${encodeURIComponent(next)}`);
}

export async function signOutAccount() {
  if (hasSupabase) { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); }
  redirect("/");
}
