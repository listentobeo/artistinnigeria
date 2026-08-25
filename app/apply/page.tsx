import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "@/components/icons";
import { createSupabaseServerClient, hasSupabase } from "@/lib/supabase/server";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title:"Join the Commission House", description:"Create an account-based profile and apply to receive managed art commissions in Nigeria." };
export default async function ApplyPage(){
  if(hasSupabase){const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect("/auth/sign-up?next=/apply");}
  return <section className="form-page"><div className="shell form-layout"><aside className="form-intro"><p className="eyebrow">For working artists</p><h1>Join the commission house.</h1><p>Create an account-based profile, receive structured briefs and manage paid commissions from quote to verified review.</p><ul className="form-points"><li><Check size={18}/> Search-friendly verified profile</li><li><Check size={18}/> Structured requests and written quotes</li><li><Check size={18}/> Secure Paystack bookings</li><li><Check size={18}/> 10% commission on completed bookings</li></ul></aside><ApplicationForm/></div></section>;
}
