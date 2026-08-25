import Link from "next/link";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { recordSuccessfulPaystackPayment } from "@/lib/payments";
export const metadata={title:"Payment status",robots:{index:false,follow:false}}; export const dynamic="force-dynamic";
export default async function PaymentCallback({searchParams}:{searchParams:Promise<{reference?:string}>}){
  const reference=(await searchParams).reference; let ok=false; let message="Payment reference is missing.";
  if(reference&&process.env.PAYSTACK_SECRET_KEY){try{const data=await verifyPaystackTransaction(reference); if(data.status==="success"){await recordSuccessfulPaystackPayment(`callback:${reference}`,data);ok=true;message="Your payment is confirmed and the artist can begin after acknowledging the booking.";}else message="Paystack has not confirmed this payment yet.";}catch{message="We could not confirm the payment yet. The webhook may still complete it automatically.";}}
  return <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Paystack payment</p><h1>{ok?"Payment confirmed":"Payment pending"}</h1><p>{message}</p><Link className="button" href="/dashboard">Return to dashboard</Link></div></section>;
}
