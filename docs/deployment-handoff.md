# Deployment handoff

## Verified external state on 25 August 2026

- `https://artistinnigeria.com` is serving the legacy static site from GitHub Pages. Its response header is `Server: GitHub.com`.
- The apex domain currently resolves to GitHub Pages addresses and `www.artistinnigeria.com` is a CNAME for `listentobeo.github.io`.
- GitHub records a successful Vercel production deployment for commit `6f06bcd`, but its generated Vercel URL is protected by Vercel Authentication and redirects anonymous visitors to Vercel SSO.
- The commission-house changes in this working tree have not been committed, pushed, migrated to Supabase or deployed.

## Safe cutover sequence

1. Commit and push the reviewed working tree. Confirm that Vercel builds the same commit SHA.
2. Configure the Vercel Production variables listed in `.env.example`. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `PAYSTACK_SECRET_KEY` as public variables.
3. Back up Supabase, apply `supabase/schema.sql`, then apply `supabase/marketplace.sql` once.
4. Create your customer account, claim Beo Art Studio, approve the claim from the private admin route, create its Paystack recipient and then mark it `payment_ready` and bookable. Beo intentionally cannot accept a live platform booking before it has an owner account.
5. Keep Paystack in test mode and `PAYSTACK_PAYOUTS_ENABLED=false`. Complete the browser acceptance matrix below.
6. Remove Vercel Authentication from the intended public Production deployment, while retaining protection on previews if desired.
7. Add `artistinnigeria.com` and `www.artistinnigeria.com` to the Vercel project. Follow the exact DNS records Vercel displays for the project.
8. Only after the Vercel deployment passes on its generated URL, replace the GitHub Pages DNS records. Keep the previous records documented so DNS rollback remains possible.
9. Confirm the apex and `www` host both resolve to Vercel, choose one canonical host, and configure the other to redirect.
10. Update Paystack's webhook to `https://artistinnigeria.com/api/payments/webhook`, repeat a test transaction, then request live approval.

## Browser acceptance matrix

Run these checks with Playwright against the generated Vercel URL before DNS cutover:

1. Anonymous visitor: homepage, all seven category hubs, representative populated and empty state pages, maps, mobile navigation, artist profile external links, metadata and noindex behavior.
2. New customer: sign up, email confirmation, sign in, submit every category-specific brief, receive and accept only the newest quote, reuse an open Paystack checkout and complete a test payment.
3. Artist claimant: claim a researched profile, confirm that booking stays disabled before approval, then edit the owned bio, photo, contact links and share public/private image and video updates.
4. Commission parties: exchange messages and private JPG, PNG, WebP and PDF attachments; confirm another account receives a 404 and cannot retrieve either the row or storage object.
5. Delivery lifecycle: artist starts work and submits it; customer requests revision, approves completion, opens a dispute inside the 72-hour window and leaves a verified review only on a completed booking.
6. Administrator: approve a claim, verify a profile, moderate public WIP/reviews, inspect dispute evidence, request a full refund, release a payout, enter transfer OTP when required and reconcile the conclusive Paystack status.
7. Security: reject an unsigned webhook, reject mismatched payment amount/currency, reject stale/concurrent state transitions, reject open redirects and confirm private pages stay out of robots/sitemap output.

Record screenshots, console errors, failed network requests, account IDs, booking IDs and Paystack test references for the launch record. Never use live cards or release a live payout during acceptance testing.
