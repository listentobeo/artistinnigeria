import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/auth/login?message=Signed%20out%20successfully.", request.url), 303);
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/login", request.url), 303);
}
