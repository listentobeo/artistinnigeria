# Commission House Operations

## Required Vercel environment

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Browser-safe | Canonical production origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | RLS-protected Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Moderation, payments and controlled storage |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Browser-safe | Reserved for future inline checkout |
| `PAYSTACK_SECRET_KEY` | Server only | Checkout, verification, refunds and transfers |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Browser-safe, domain-restricted | State maps |
| `PAYSTACK_PAYOUTS_ENABLED` | Server only | Set to `true` only after commercial approval |
| `RESEND_API_KEY` | Server only | Optional application/request admin notifications |
| `ADMIN_NOTIFICATION_EMAIL` | Server only | Private recipient for operations notifications |
| `RESEND_FROM_EMAIL` | Server only | Sender on a verified Resend domain |

## Production activation order

1. Back up the Supabase database.
2. Apply `schema.sql`, then `marketplace.sql`.
3. Create the admin Auth user and set `app_metadata.role=admin`.
4. Optional: verify a dedicated sending subdomain in Resend and configure the three notification variables. Without them, queues still work and notification sending is skipped safely.
5. Deploy Vercel without Paystack live keys and verify public pages/accounts.
6. Add Paystack test keys and register the webhook.
7. Complete request → quote → accept → test payment → funded → delivery → review tests.
8. Obtain written Paystack confirmation for the delayed-payout marketplace model.
9. Add live keys. Keep payouts disabled for the pilot.
10. Pilot with Beo and a small number of claimed artists.
11. Enable payouts only after reconciliation and dispute procedures have been exercised.

Paystack may return an `otp` transfer status when transfer confirmation is enabled. Enter the six-digit code in the private payout queue to call Paystack's Finalize Transfer endpoint. Do not retry a non-conclusive transfer under a new reference. See the official [Paystack transfer lifecycle](https://paystack.com/docs/transfers/how-transfers-work/) and [Finalize Transfer API](https://paystack.com/docs/api/transfer/).

## Artist onboarding

Researched records are public but explicitly unclaimed and cannot accept money. An artist becomes bookable only after ownership, identity, location, portfolio ownership and payout recipient checks. Do not copy an artist's images without permission.

## Money model

The platform fee is 10% of the artistic commission subtotal. Separately itemised delivery, travel and installation reimbursements do not increase the fee. Paystack fees are absorbed from platform revenue in the initial policy. Amounts are always stored in kobo.

Automatic Paystack transaction splits are not used because they can settle an artist before the customer accepts delivery. The code therefore gates a Paystack Transfer behind completion, a 72-hour eligibility period and an admin action. Do not describe this as escrow without appropriate legal and payment-provider approval.

## Incident and dispute handling

- Treat Paystack webhook events as the payment source of truth.
- Never release a payout on a disputed booking.
- Preserve accepted agreements, messages, status history and delivery evidence.
- Respond immediately to Paystack dispute notifications.
- Refund from the admin dashboard only after recording the decision.
- A reversed transfer remains artist-payable and should be retried after bank details are checked.

## Content and privacy

Public work-in-progress updates require the artist to confirm permission and require moderation. Booking-private updates remain visible only to the customer, artist and administrators. Public display ends after 24 hours. Exact home addresses must never be exposed; map pins are limited to opted-in public studios.
