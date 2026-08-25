import { createSupabaseAdminClient } from "./supabase/server";

export async function recordSuccessfulPaystackPayment(eventKey:string,data:any){
  const admin=createSupabaseAdminClient(); const {data:recorded,error}=await admin.rpc("record_paystack_charge",{p_event_key:eventKey,p_reference:data.reference,p_amount:data.amount,p_currency:data.currency||"NGN",p_payload:data});
  if(error) throw error; return recorded as boolean;
}
