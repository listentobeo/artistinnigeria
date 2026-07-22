# Artist in Nigeria

A multi-tenant artist directory built with Next.js App Router and Supabase. It includes programmatic state and artist pages, artist applications with portfolio uploads, an authenticated moderation dashboard, ISR, structured data, and a dynamic sitemap.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add Supabase credentials.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Create the single admin user in Supabase Authentication.
5. Start the app: `npm run dev`

Without environment variables, the site runs in preview mode with Beo Art Studio as seed data. Submissions and admin login intentionally remain disabled until Supabase is connected.

## Deployment

Set all four variables from `.env.example` in Vercel. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed as a public variable.
