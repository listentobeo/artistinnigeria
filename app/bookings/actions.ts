"use server";
import { revalidatePath } from "next/cache";
import { canTransitionBooking } from "@/lib/marketplace";
import type { BookingStatus } from "@/lib/types";
import { createSupabaseAdminClient,createSupabaseServerClient } from "@/lib/supabase/server";

async function context(bookingId:string){
  const client=await createSupabaseServerClient(); const {data:{user}}=await client.auth.getUser(); if(!user) throw new Error("Sign in required.");
  const {data:booking}=await client.from("bookings").select("*,artists!inner(owner_user_id)").eq("id",bookingId).maybeSingle(); if(!booking) throw new Error("Booking not found.");
  const isCustomer=booking.customer_id===user.id,isArtist=(booking.artists as any).owner_user_id===user.id,isAdmin=String(user.app_metadata?.role||"")==="admin"; if(!isCustomer&&!isArtist&&!isAdmin) throw new Error("Not authorised.");
  return {user,booking,isCustomer,isArtist,isAdmin};
}

export async function transitionBooking(formData:FormData){
  const bookingId=String(formData.get("booking_id")); const to=String(formData.get("to_status")) as BookingStatus; const reason=String(formData.get("reason")||"").trim(); const ctx=await context(bookingId); const from=ctx.booking.status as BookingStatus;
  if(!canTransitionBooking(from,to)) throw new Error(`Cannot move this booking from ${from} to ${to}.`);
  const artistAllowed=(from==="funded"&&to==="in_progress")||(["in_progress","revision_requested"].includes(from)&&to==="awaiting_client_approval")||(["funded","in_progress","awaiting_client_approval","revision_requested","completed"].includes(from)&&to==="disputed");
  const customerAllowed=(from==="quote_accepted"&&to==="cancelled")||(from==="awaiting_client_approval"&&["completed","revision_requested","disputed"].includes(to))||(["funded","in_progress","completed"].includes(from)&&to==="disputed");
  if(!(ctx.isAdmin||(ctx.isArtist&&artistAllowed)||(ctx.isCustomer&&customerAllowed))) throw new Error("Your account cannot make that transition.");
  if(["revision_requested","disputed"].includes(to)&&reason.length<10) throw new Error("Explain the revision or dispute.");
  if(from==="completed"&&to==="disputed"&&(!ctx.booking.payout_eligible_at||new Date(ctx.booking.payout_eligible_at)<=new Date()))throw new Error("The post-completion dispute window has closed. Contact support with the booking reference.");
  const now=new Date(); const update:any={status:to,updated_at:now.toISOString()}; if(to==="completed"){update.completed_at=now.toISOString();update.payout_eligible_at=new Date(now.getTime()+72*3600000).toISOString();}
  const admin=createSupabaseAdminClient(); const {data:changed,error}=await admin.from("bookings").update(update).eq("id",bookingId).eq("status",from).select("id").maybeSingle(); if(error) throw error;
  if(!changed) throw new Error("This booking changed in another session. Refresh before trying again.");
  await admin.from("booking_status_history").insert({booking_id:bookingId,from_status:from,to_status:to,changed_by:ctx.user.id,reason:reason||null});
  if(to==="disputed") await Promise.all([admin.from("disputes").insert({booking_id:bookingId,opened_by:ctx.user.id,reason}),admin.from("reviews").update({moderation_status:"hidden",updated_at:now.toISOString()}).eq("booking_id",bookingId)]); revalidatePath(`/bookings/${bookingId}`);
}

export async function sendBookingMessage(formData:FormData){
  const bookingId=String(formData.get("booking_id")); const body=String(formData.get("body")||"").trim(); const ctx=await context(bookingId); if(!body) throw new Error("Message cannot be empty.");
  const attachments=formData.getAll("attachments").filter((item):item is File=>item instanceof File&&item.size>0);
  if(attachments.length>3) throw new Error("Attach no more than 3 files per message.");
  const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
  if(attachments.some(file=>file.size>15*1024*1024||!allowed.has(file.type))) throw new Error("Attachments must be JPG, PNG, WebP or PDF files under 15 MB each.");
  const admin=createSupabaseAdminClient();const {count}=await admin.from("booking_messages").select("id",{count:"exact",head:true}).eq("booking_id",bookingId).eq("sender_id",ctx.user.id).gte("created_at",new Date(Date.now()-60000).toISOString());if((count||0)>=20)throw new Error("Too many messages. Wait a minute before sending another."); const uploaded:string[]=[];
  try{
    for(const file of attachments){const extension=file.type==="application/pdf"?"pdf":file.type.split("/")[1];const path=`${bookingId}/${crypto.randomUUID()}.${extension}`;const {error}=await admin.storage.from("booking-files").upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;uploaded.push(path);}
    const {error}=await admin.from("booking_messages").insert({booking_id:bookingId,sender_id:ctx.user.id,body,attachment_urls:uploaded}); if(error) throw error;
  }catch(error){if(uploaded.length)await admin.storage.from("booking-files").remove(uploaded);throw error;}
  revalidatePath(`/bookings/${bookingId}`);
}

export async function submitReview(formData:FormData){
  const bookingId=String(formData.get("booking_id")); const ctx=await context(bookingId); if(!ctx.isCustomer||ctx.booking.status!=="completed") throw new Error("Only the customer can review a completed booking.");
  const rating=(name:string)=>Number(formData.get(name)); const ratings=["overall","communication","quality","timeliness"].map(rating);if(ratings.some(value=>!Number.isInteger(value)||value<1||value>5))throw new Error("Ratings must be whole numbers from 1 to 5.");const body=String(formData.get("body")||"").trim();if(body.length<20||body.length>2000)throw new Error("Review text must be between 20 and 2,000 characters."); const admin=createSupabaseAdminClient(); const {error}=await admin.from("reviews").insert({booking_id:bookingId,artist_id:ctx.booking.artist_id,customer_id:ctx.user.id,overall:ratings[0],communication:ratings[1],quality:ratings[2],timeliness:ratings[3],body,moderation_status:"pending"}); if(error) throw error; revalidatePath(`/bookings/${bookingId}`);
}
export async function respondToReview(formData:FormData){const bookingId=String(formData.get("booking_id"));const ctx=await context(bookingId);if(!ctx.isArtist)throw new Error("Only the commissioned artist can respond.");const response=String(formData.get("artist_response")||"").trim();if(response.length<10)throw new Error("Write a complete response.");const admin=createSupabaseAdminClient();const {error}=await admin.from("reviews").update({artist_response:response,updated_at:new Date().toISOString()}).eq("booking_id",bookingId).eq("artist_id",ctx.booking.artist_id);if(error)throw error;revalidatePath(`/bookings/${bookingId}`);}
