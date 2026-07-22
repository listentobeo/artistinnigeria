"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";

async function requireUser() {
  if (!hasSupabase) throw new Error("Supabase is not configured.");
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authorized.");
  return client;
}

function featuredFields(formData: FormData) {
  const featured = formData.get("featured") === "on";
  const untilValue = String(formData.get("featured_until") || "").trim();
  return {
    featured,
    featured_until: featured && untilValue ? new Date(`${untilValue}T23:59:59.999Z`).toISOString() : null,
    featured_tier: featured ? String(formData.get("featured_tier") || "manual") : null,
  };
}

function revalidateDirectory() {
  revalidatePath("/", "layout");
}

export async function moderateArtist(formData: FormData) {
  await requireUser();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Service role key is missing.");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["approved", "rejected"].includes(status)) throw new Error("Invalid moderation status.");
  const update = status === "approved"
    ? { status, updated_at: new Date().toISOString(), ...featuredFields(formData) }
    : { status, updated_at: new Date().toISOString() };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("artists").update(update).eq("id", id);
  if (error) throw error;
  revalidateDirectory();
}

export async function updateFeaturedPlacement(formData: FormData) {
  await requireUser();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Service role key is missing.");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("artists").update({ ...featuredFields(formData), updated_at: new Date().toISOString() }).eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidateDirectory();
}

export async function signOut() {
  const client = await requireUser();
  await client.auth.signOut();
  redirect("/admin/login");
}
