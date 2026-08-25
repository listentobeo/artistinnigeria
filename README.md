# Artist in Nigeria Commission House

A Next.js and Supabase managed art-commission marketplace. Customers send structured briefs, artists return versioned quotes, Paystack collects payment, both parties track progress in a protected booking, and verified customers review completed commissions. The platform earns 10% of the commissionable artistic subtotal.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and provide the configured values.
3. Run `supabase/schema.sql` once in Supabase SQL Editor.
4. Run `supabase/marketplace.sql` once after the base schema.
5. Give the private administrator user `{"role":"admin"}` in Supabase Auth `app_metadata`.
6. Run `npm run dev`.

Without environment variables, public pages run in safe preview mode with Beo Art Studio seed data. Accounts, applications, Paystack and private workspaces stay disabled.

## Verification

- `npm test` — fee, state-machine and Paystack signature tests
- `npm run lint` — Next.js/TypeScript linting
- `npm run build` — Vercel-equivalent production build
- `npm run check` — all three in sequence

## Vercel

This application requires a server runtime and must not be deployed as a GitHub Pages static export. Connect the repository to Vercel, set all `.env.example` values for Production and Preview as appropriate, and use the normal Next.js build command.

Configure the Paystack webhook as:

`https://artistinnigeria.com/api/payments/webhook`

Leave `PAYSTACK_PAYOUTS_ENABLED` unset until Paystack has approved delayed marketplace payouts. See `docs/operations.md` before enabling real money.

The verified domain/DNS cutover sequence and browser acceptance matrix are in `docs/deployment-handoff.md`.
