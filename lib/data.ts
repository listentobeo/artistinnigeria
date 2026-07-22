import { featuredArtist, states as fallbackStates } from "./constants";
import { createSupabasePublicClient, hasSupabase } from "./supabase/server";
import type { Artist, NigerianState } from "./types";
import type { ArtistCategory } from "./categories";
import { isActiveFeatured } from "./categories";

export async function getStates(): Promise<NigerianState[]> {
  if (!hasSupabase) return fallbackStates;
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("states").select("name,slug").order("name");
  return data?.length ? data : fallbackStates;
}

export async function getApprovedArtists(): Promise<Artist[]> {
  if (!hasSupabase) return [featuredArtist];
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("artists").select("*").eq("status", "approved")
    .order("featured", { ascending: false }).order("created_at", { ascending: false });
  return (data as Artist[] | null)?.length ? data as Artist[] : [featuredArtist];
}

export async function getArtist(slug: string): Promise<Artist | null> {
  if (!hasSupabase) return slug === featuredArtist.slug ? featuredArtist : null;
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("artists").select("*").eq("slug", slug)
    .eq("status", "approved").maybeSingle();
  return data as Artist | null;
}

export async function getArtistsForState(stateName: string): Promise<Artist[]> {
  const artists = await getApprovedArtists();
  return artists.filter((artist) => artist.states_served.some((state) =>
    state.toLowerCase() === stateName.toLowerCase(),
  ));
}

export async function getArtistsForCategoryState(category: ArtistCategory, stateName: string): Promise<Artist[]> {
  const artists = await getApprovedArtists();
  return artists.filter((artist) => {
    if (isActiveFeatured(artist.featured, artist.featured_until)) return true;
    const servesState = artist.states_served.some((state) => state.toLowerCase() === stateName.toLowerCase());
    const matchesCategory = artist.categories.some((item) => item.toLowerCase() === category.databaseValue.toLowerCase());
    return servesState && matchesCategory;
  });
}
