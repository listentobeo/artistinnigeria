import crypto from "node:crypto";

const baseUrl = "https://api.paystack.co";
function secret() { const value = process.env.PAYSTACK_SECRET_KEY; if (!value) throw new Error("Paystack is not configured."); return value; }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init.headers }, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload.status) throw new Error(payload.message || "Paystack request failed");
  return payload.data as T;
}

export function initializePaystackTransaction(input: { email: string; amountKobo: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return request<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amountKobo, reference: input.reference, callback_url: input.callbackUrl, metadata: input.metadata, channels: ["card", "bank", "ussd", "bank_transfer"] }) });
}
export function verifyPaystackTransaction(reference: string) { return request<{ status: string; amount: number; reference: string; currency: string; paid_at: string }>(`/transaction/verify/${encodeURIComponent(reference)}`); }
export function initiatePaystackTransfer(input:{amountKobo:number;recipientCode:string;reference:string;reason:string}) { return request<{transfer_code:string;status:string;reference:string}>("/transfer",{method:"POST",body:JSON.stringify({source:"balance",amount:input.amountKobo,recipient:input.recipientCode,reference:input.reference,reason:input.reason})}); }
export function finalizePaystackTransfer(transferCode:string,otp:string){return request<{transfer_code:string;status:string;reference:string}>("/transfer/finalize_transfer",{method:"POST",body:JSON.stringify({transfer_code:transferCode,otp})});}
export function verifyPaystackTransfer(reference:string){return request<{transfer_code:string;status:string;reference:string;amount:number;currency:string}>(`/transfer/verify/${encodeURIComponent(reference)}`);}
export function initiatePaystackRefund(transaction:string,amountKobo?:number) { return request<{id:number;status:string;transaction:{reference:string}}>("/refund",{method:"POST",body:JSON.stringify({transaction,...(amountKobo?{amount:amountKobo}:{})})}); }
export function verifyPaystackWebhook(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
