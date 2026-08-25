"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateBookingMoney } from "@/lib/marketplace";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function createQuote(formData: FormData) {
  const client=await createSupabaseServerClient(); const {data:{user}}=await client.auth.getUser(); if(!user) redirect("/auth/login");
  const requestId=String(formData.get("request_id")); const {data:request}=await client.from("commission_requests").select("id,artist_id,artists!inner(owner_user_id)").eq("id",requestId).maybeSingle();
  if(!request || (request.artists as any).owner_user_id!==user.id) throw new Error("Only the selected artist can quote this request.");
  const commissionable=Number(formData.get("commissionable_naira")),reimbursable=Number(formData.get("reimbursable_naira")||0);if(!Number.isFinite(commissionable)||commissionable<1000||commissionable>10_000_000||!Number.isFinite(reimbursable)||reimbursable<0||reimbursable>10_000_000)throw new Error("Enter valid quote amounts between ₦1,000 and ₦10,000,000.");
  const deliverables=String(formData.get("deliverables")||"").trim(),cancellation=String(formData.get("cancellation")||"").trim(),rights=String(formData.get("rights")||"").trim(),deliveryDate=String(formData.get("delivery_date")||"");const revisions=Number(formData.get("revisions")||0);if(deliverables.length<20||deliverables.length>3000||cancellation.length<10||rights.length<10||!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)||!Number.isInteger(revisions)||revisions<0||revisions>20)throw new Error("Complete the deliverables, delivery date, revisions and written terms.");
  const money=calculateBookingMoney(Math.round(commissionable*100),Math.round(reimbursable*100)); const admin=createSupabaseAdminClient();
  const {data:existingBooking}=await admin.from("bookings").select("id").eq("request_id",requestId).maybeSingle();if(existingBooking)throw new Error("This request already has an accepted booking.");
  const {data:latest}=await admin.from("quotes").select("version").eq("request_id",requestId).order("version",{ascending:false}).limit(1).maybeSingle();
  const terms={revisions,delivery_date:deliveryDate,cancellation,rights};
  const {error}=await admin.from("quotes").insert({request_id:requestId,artist_id:request.artist_id,version:(latest?.version||0)+1,deliverables,terms_snapshot:terms,commissionable_kobo:money.commissionableKobo,reimbursable_kobo:money.reimbursableKobo,platform_fee_kobo:money.platformFeeKobo,artist_entitlement_kobo:money.artistEntitlementKobo,customer_total_kobo:money.customerTotalKobo,expires_at:new Date(Date.now()+7*86400000).toISOString()});
  if(error) throw error; revalidatePath(`/requests/${requestId}`);
}

export async function acceptQuote(formData: FormData) {
  const client=await createSupabaseServerClient(); const {data:{user}}=await client.auth.getUser(); if(!user) redirect("/auth/login");
  const quoteId=String(formData.get("quote_id")); const {data:quote}=await client.from("quotes").select("*,commission_requests!inner(customer_id,title,category,brief,target_date,state_slug)").eq("id",quoteId).maybeSingle();
  if(!quote || (quote.commission_requests as any).customer_id!==user.id || quote.accepted_at || new Date(quote.expires_at)<new Date()) throw new Error("This quote cannot be accepted.");
  const admin=createSupabaseAdminClient();const {data:latest}=await admin.from("quotes").select("id").eq("request_id",quote.request_id).order("version",{ascending:false}).limit(1).maybeSingle();if(latest?.id!==quote.id)throw new Error("A newer quote is available. Review it before accepting."); const now=new Date().toISOString(); const agreement={quote_version:quote.version,deliverables:quote.deliverables,terms:quote.terms_snapshot,request:quote.commission_requests,accepted_by:user.id,accepted_at:now};
  const {data:booking,error}=await admin.from("bookings").insert({request_id:quote.request_id,quote_id:quote.id,customer_id:user.id,artist_id:quote.artist_id,status:"quote_accepted",agreement_snapshot:agreement,commissionable_kobo:quote.commissionable_kobo,reimbursable_kobo:quote.reimbursable_kobo,platform_fee_kobo:quote.platform_fee_kobo,artist_entitlement_kobo:quote.artist_entitlement_kobo,customer_total_kobo:quote.customer_total_kobo,currency:quote.currency}).select("id").single();
  if(error) throw error; await Promise.all([admin.from("quotes").update({accepted_at:now}).eq("id",quote.id),admin.from("booking_status_history").insert({booking_id:booking.id,to_status:"quote_accepted",changed_by:user.id,reason:"Customer accepted quote"})]); redirect(`/bookings/${booking.id}`);
}
