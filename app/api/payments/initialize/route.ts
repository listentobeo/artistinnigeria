import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient,createSupabaseServerClient,hasSupabase } from "@/lib/supabase/server";
import { initializePaystackTransaction } from "@/lib/paystack";

export async function POST(request:Request){
  if(!hasSupabase||!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({error:"Payments are not configured."},{status:503});
  const client=await createSupabaseServerClient(); const {data:{user}}=await client.auth.getUser(); if(!user) return NextResponse.redirect(new URL("/auth/login",request.url),303);
  const form=await request.formData(); const bookingId=String(form.get("booking_id")||""); const {data:booking}=await client.from("bookings").select("id,customer_id,customer_total_kobo,currency,status,artists(business_name)").eq("id",bookingId).maybeSingle();
  if(!booking||booking.customer_id!==user.id||!["quote_accepted","payment_pending"].includes(booking.status)) return NextResponse.json({error:"Booking is not payable."},{status:400});
  if(!user.email) return NextResponse.json({error:"Add an email address to your account before paying."},{status:400});
  const reference=`AIN-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`; const site=new URL(process.env.NEXT_PUBLIC_SITE_URL||request.url).origin; const admin=createSupabaseAdminClient();
  const {data:open}=await admin.from("payment_attempts").select("provider_payload").eq("booking_id",booking.id).eq("status","initialized").maybeSingle();const existingUrl=(open?.provider_payload as any)?.authorization_url;if(typeof existingUrl==="string"&&existingUrl.startsWith("https://checkout.paystack.com/"))return NextResponse.redirect(existingUrl,303);if(open)return NextResponse.json({error:"Payment checkout is already being prepared. Try again shortly."},{status:409});
  const {error}=await admin.from("payment_attempts").insert({booking_id:booking.id,reference,amount_kobo:booking.customer_total_kobo,currency:booking.currency,status:"initialized"}); if(error) return NextResponse.json({error:error.message},{status:400});
  try{const initialized=await initializePaystackTransaction({email:user.email,amountKobo:booking.customer_total_kobo,reference,callbackUrl:`${site}/payments/callback?reference=${encodeURIComponent(reference)}`,metadata:{booking_id:booking.id,customer_id:user.id,artist:(booking.artists as any)?.business_name}});const [{error:attemptError},{error:bookingError}]=await Promise.all([admin.from("payment_attempts").update({provider_payload:initialized,updated_at:new Date().toISOString()}).eq("reference",reference),admin.from("bookings").update({status:"payment_pending",updated_at:new Date().toISOString()}).eq("id",booking.id).eq("status",booking.status)]);if(attemptError||bookingError)throw attemptError||bookingError; return NextResponse.redirect(initialized.authorization_url,303);}
  catch(error){await admin.from("payment_attempts").update({status:"failed",provider_payload:{message:error instanceof Error?error.message:"Initialization failed"}}).eq("reference",reference); return NextResponse.json({error:"Could not start Paystack checkout."},{status:502});}
}
