-- Artist in Nigeria marketplace migration.
-- Run once after schema.sql. Repeated seed inserts are guarded, while policies are migration-managed.
create extension if not exists "pgcrypto";

do $$ begin create type public.app_role as enum ('customer','artist','support','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.verification_state as enum ('researched','contacted','claimed','identity_verified','portfolio_approved','payment_ready','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_status as enum ('draft','submitted','artist_reviewing','quoted','quote_accepted','payment_pending','funded','in_progress','awaiting_client_approval','revision_requested','completed','disputed','cancelled','refund_pending','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type public.location_relationship as enum ('based_in','travels_to','ships_to','documented_project'); exception when duplicate_object then null; end $$;
do $$ begin create type public.moderation_status as enum ('pending','published','rejected','hidden'); exception when duplicate_object then null; end $$;

alter table public.artists add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.artists add column if not exists verification_state public.verification_state not null default 'researched';
alter table public.artists add column if not exists bookable boolean not null default false;
alter table public.artists add column if not exists base_state text;
alter table public.artists add column if not exists public_address text;
alter table public.artists add column if not exists paystack_recipient_code text;
alter table public.artists add column if not exists response_time_hours integer check (response_time_hours between 1 and 720);
alter table public.artists add column if not exists moderation_reason text;
create index if not exists artists_owner_idx on public.artists(owner_user_id);
create unique index if not exists artists_one_profile_per_owner_idx on public.artists(owner_user_id) where owner_user_id is not null;
create index if not exists artists_bookable_idx on public.artists(bookable) where status = 'approved';

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text not null default '', phone text, avatar_url text,
  account_status text not null default 'active' check (account_status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.artist_locations (
  artist_id uuid not null references public.artists(id) on delete cascade,
  state_slug text not null references public.states(slug) on delete cascade,
  relationship public.location_relationship not null,
  evidence_url text, verified_at timestamptz,
  primary key (artist_id,state_slug,relationship)
);

create table if not exists public.artist_claims (
  id uuid primary key default gen_random_uuid(), artist_id uuid not null references public.artists(id) on delete cascade,
  claimant_user_id uuid not null references auth.users(id) on delete cascade,
  evidence text not null, status public.moderation_status not null default 'pending',
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now(),
  unique (artist_id, claimant_user_id)
);

create table if not exists public.commission_requests (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id),
  artist_id uuid not null references public.artists(id), category text not null, title text not null,
  brief jsonb not null default '{}'::jsonb, state_slug text references public.states(slug),
  target_date date, budget_min_kobo bigint check (budget_min_kobo >= 0), budget_max_kobo bigint check (budget_max_kobo >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.commission_requests(id) on delete cascade,
  artist_id uuid not null references public.artists(id), version integer not null default 1,
  deliverables text not null, terms_snapshot jsonb not null default '{}'::jsonb,
  commissionable_kobo bigint not null check (commissionable_kobo >= 0), reimbursable_kobo bigint not null default 0 check (reimbursable_kobo >= 0),
  platform_fee_kobo bigint not null check (platform_fee_kobo >= 0), artist_entitlement_kobo bigint not null check (artist_entitlement_kobo >= 0),
  customer_total_kobo bigint not null check (customer_total_kobo >= 0), currency text not null default 'NGN',
  expires_at timestamptz not null, accepted_at timestamptz, created_at timestamptz not null default now(),
  unique(request_id,version)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique references public.commission_requests(id),
  quote_id uuid not null unique references public.quotes(id), customer_id uuid not null references auth.users(id), artist_id uuid not null references public.artists(id),
  status public.booking_status not null default 'quote_accepted', agreement_snapshot jsonb not null,
  commissionable_kobo bigint not null, reimbursable_kobo bigint not null default 0, platform_fee_kobo bigint not null,
  artist_entitlement_kobo bigint not null, customer_total_kobo bigint not null, currency text not null default 'NGN',
  funded_at timestamptz, completed_at timestamptz, payout_eligible_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists bookings_customer_idx on public.bookings(customer_id,created_at desc);
create index if not exists bookings_artist_idx on public.bookings(artist_id,created_at desc);

create table if not exists public.booking_status_history (
  id bigint generated always as identity primary key, booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status, to_status public.booking_status not null, changed_by uuid references auth.users(id),
  reason text, created_at timestamptz not null default now()
);

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id), body text not null check (char_length(body) between 1 and 5000),
  attachment_urls text[] not null default '{}', created_at timestamptz not null default now()
);

create table if not exists public.artist_updates (
  id uuid primary key default gen_random_uuid(), artist_id uuid not null references public.artists(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade, caption text not null check (char_length(caption) <= 500),
  media_url text not null, visibility text not null check (visibility in ('public','booking_private')),
  client_consent boolean not null default false, moderation_status public.moderation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '24 hours'), created_at timestamptz not null default now(),
  check (visibility = 'booking_private' or client_consent)
);
create index if not exists artist_updates_active_idx on public.artist_updates(artist_id,expires_at desc);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
  provider text not null default 'paystack', reference text not null unique, amount_kobo bigint not null,
  currency text not null default 'NGN', status text not null default 'initialized', provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists payment_attempts_one_open_idx on public.payment_attempts(booking_id) where status='initialized';

create table if not exists public.paystack_events (
  event_key text primary key, event_type text not null, payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), payment_attempt_id uuid references public.payment_attempts(id),
  account text not null check (account in ('customer_funds','artist_payable','platform_revenue','refund_payable','processor_fees')),
  direction text not null check (direction in ('debit','credit')), amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN', reference text not null, created_at timestamptz not null default now(),
  unique(account,direction,reference)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id), artist_id uuid not null references public.artists(id),
  amount_kobo bigint not null check (amount_kobo > 0), recipient_code text not null, transfer_code text,
  reference text not null unique, status text not null default 'pending', failure_reason text,
  initiated_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), opened_by uuid not null references auth.users(id),
  reason text not null, evidence_urls text[] not null default '{}', status text not null default 'open',
  resolution text, resolved_by uuid references auth.users(id), resolved_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
  artist_id uuid not null references public.artists(id), customer_id uuid not null references auth.users(id),
  overall smallint not null check (overall between 1 and 5), communication smallint check (communication between 1 and 5),
  quality smallint check (quality between 1 and 5), timeliness smallint check (timeliness between 1 and 5),
  body text not null check (char_length(body) between 20 and 2000), artist_response text,
  moderation_status public.moderation_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.state_content (
  state_slug text primary key references public.states(slug) on delete cascade, capital text not null,
  major_cities text[] not null default '{}', map_query text not null, local_summary text not null,
  source_urls text[] not null default '{}', last_verified_at date not null
);

create table if not exists public.service_location_content (
  state_slug text not null references public.states(slug), category_slug text not null,
  introduction text not null, hiring_notes text not null, faq jsonb not null default '[]'::jsonb,
  source_urls text[] not null default '{}', last_verified_at date not null,
  primary key(state_slug,category_slug)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
  entity_type text not null, entity_id text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false)
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'customer') on conflict(user_id) do nothing;
  return new;
end $$;
insert into public.profiles(user_id,full_name,role)
select id,coalesce(raw_user_meta_data->>'full_name',''),'customer' from auth.users
on conflict(user_id) do nothing;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.artist_locations enable row level security;
alter table public.artist_claims enable row level security;
alter table public.commission_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.booking_messages enable row level security;
alter table public.artist_updates enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.paystack_events enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.disputes enable row level security;
alter table public.reviews enable row level security;
alter table public.state_content enable row level security;
alter table public.service_location_content enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated admins can update artists" on public.artists;
drop policy if exists "Artist owner or admin updates" on public.artists;
drop policy if exists "Owner and admin read artists" on public.artists;
drop policy if exists "Approved artists are publicly readable" on public.artists;
create policy "Approved artists are publicly readable" on public.artists for select
  using (status = 'approved' or owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (user_id=auth.uid() or public.is_admin());
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Public reads artist locations" on public.artist_locations;
drop policy if exists "Owners manage artist locations" on public.artist_locations;
create policy "Public reads verified artist locations" on public.artist_locations for select using (verified_at is not null or public.is_admin() or exists(select 1 from public.artists a where a.id=artist_id and a.owner_user_id=auth.uid()));
drop policy if exists "Claimants manage own claims" on public.artist_claims;
create policy "Claimants read own claims" on public.artist_claims for select to authenticated using (claimant_user_id=auth.uid() or public.is_admin());
drop policy if exists "Customers manage own requests" on public.commission_requests;
create policy "Request parties read requests" on public.commission_requests for select to authenticated using (customer_id=auth.uid() or public.is_admin() or exists(select 1 from public.artists a where a.id=artist_id and a.owner_user_id=auth.uid()));
drop policy if exists "Booking parties read quotes" on public.quotes;
create policy "Booking parties read quotes" on public.quotes for select to authenticated using (public.is_admin() or exists(select 1 from public.commission_requests r left join public.artists a on a.id=r.artist_id where r.id=request_id and (r.customer_id=auth.uid() or a.owner_user_id=auth.uid())));
drop policy if exists "Artist owners create quotes" on public.quotes;
drop policy if exists "Booking parties read bookings" on public.bookings;
create policy "Booking parties read bookings" on public.bookings for select to authenticated using (customer_id=auth.uid() or public.is_admin() or exists(select 1 from public.artists a where a.id=artist_id and a.owner_user_id=auth.uid()));
drop policy if exists "Booking parties read payment attempts" on public.payment_attempts;
create policy "Booking parties read payment attempts" on public.payment_attempts for select to authenticated using (exists(select 1 from public.bookings b left join public.artists a on a.id=b.artist_id where b.id=booking_id and (b.customer_id=auth.uid() or a.owner_user_id=auth.uid() or public.is_admin())));
drop policy if exists "Booking parties read payouts" on public.payouts;
create policy "Booking parties read payouts" on public.payouts for select to authenticated using (exists(select 1 from public.bookings b left join public.artists a on a.id=b.artist_id where b.id=booking_id and (b.customer_id=auth.uid() or a.owner_user_id=auth.uid() or public.is_admin())));
drop policy if exists "Booking parties read history" on public.booking_status_history;
create policy "Booking parties read history" on public.booking_status_history for select to authenticated using (exists(select 1 from public.bookings b left join public.artists a on a.id=b.artist_id where b.id=booking_id and (b.customer_id=auth.uid() or a.owner_user_id=auth.uid() or public.is_admin())));
drop policy if exists "Booking parties read messages" on public.booking_messages;
create policy "Booking parties read messages" on public.booking_messages for select to authenticated using (exists(select 1 from public.bookings b left join public.artists a on a.id=b.artist_id where b.id=booking_id and (b.customer_id=auth.uid() or a.owner_user_id=auth.uid() or public.is_admin())));
drop policy if exists "Booking parties send messages" on public.booking_messages;
drop policy if exists "Public reads active approved updates" on public.artist_updates;
create policy "Public reads active approved updates" on public.artist_updates for select using ((visibility='public' and moderation_status='published' and expires_at>now()) or public.is_admin() or exists(select 1 from public.artists a where a.id=artist_id and a.owner_user_id=auth.uid()) or (booking_id is not null and exists(select 1 from public.bookings b where b.id=booking_id and b.customer_id=auth.uid())));
drop policy if exists "Artist owners create updates" on public.artist_updates;
drop policy if exists "Parties read disputes" on public.disputes;
create policy "Parties read disputes" on public.disputes for select to authenticated using (public.is_admin() or opened_by=auth.uid() or exists(select 1 from public.bookings b join public.artists a on a.id=b.artist_id where b.id=booking_id and a.owner_user_id=auth.uid()));
drop policy if exists "Parties open disputes" on public.disputes;
drop policy if exists "Public reads published reviews" on public.reviews;
create policy "Public reads published reviews" on public.reviews for select using (moderation_status='published' or customer_id=auth.uid() or public.is_admin() or exists(select 1 from public.artists a where a.id=artist_id and a.owner_user_id=auth.uid()));
drop policy if exists "Customers review completed bookings" on public.reviews;
create policy "Public reads state content" on public.state_content for select using (true);
create policy "Public reads service location content" on public.service_location_content for select using (true);
create policy "Admins manage state content" on public.state_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage service content" on public.service_location_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- All marketplace mutations pass through authenticated server actions and the service role.
-- This prevents clients from changing roles, verification/payment fields, quote maths, or workflow states via PostgREST.
revoke insert,update,delete on public.profiles,public.artist_locations,public.artist_claims,public.commission_requests,public.quotes,public.bookings,public.booking_status_history,public.booking_messages,public.artist_updates,public.payment_attempts,public.paystack_events,public.ledger_entries,public.payouts,public.disputes,public.reviews,public.audit_logs from anon,authenticated;
revoke update,delete on public.artists from anon,authenticated;
revoke select on public.artists from anon,authenticated;
grant select(id,slug,business_name,owner_name,whatsapp,bio,categories,states_served,profile_image_url,portfolio_image_urls,instagram,portfolio_link,price_range,status,featured,featured_until,featured_tier,created_at,updated_at,verification_state,bookable,base_state,public_address,response_time_hours) on public.artists to anon;
grant select(id,slug,business_name,owner_name,whatsapp,bio,categories,states_served,profile_image_url,portfolio_image_urls,instagram,portfolio_link,price_range,status,featured,featured_until,featured_tier,created_at,updated_at,owner_user_id,verification_state,bookable,base_state,public_address,response_time_hours,moderation_reason) on public.artists to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('booking-files','booking-files',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('artist-updates','artist-updates',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Researched profiles are intentionally unclaimed and non-bookable until the artist consents.
insert into public.artists(slug,business_name,owner_name,email,whatsapp,bio,categories,states_served,instagram,portfolio_link,status,verification_state,bookable,base_state)
values
 ('chembx-art-studio','Chembx Art Studio','Chembaline C. Uche','unclaimed+chembx@artistinnigeria.invalid','','Lagos studio producing commissioned portraits and works across drawing, painting and sculpture.',array['Portrait','Sculpture & Carving'],array['Lagos'],'https://instagram.com/art.chembx_','https://www.chembx.com/theartist.php','approved','researched',false,'Lagos'),
 ('hannatu-ageni-yusuf','Hannatu Ageni-Yusuf','Hannatu Ageni-Yusuf','unclaimed+hannatu@artistinnigeria.invalid','','Lagos-based painter working in portraiture and contemporary painting.',array['Portrait','Abstract & Contemporary'],array['Lagos'],null,'https://www.hannatuageniyusuf.com/about','approved','researched',false,'Lagos'),
 ('peniel-abiola','Peniel Abiola','Peniel Abiola','unclaimed+peniel@artistinnigeria.invalid','','Lagos multidisciplinary artist with a documented mural portfolio.',array['Mural'],array['Lagos'],'https://instagram.com/penieltheartist','https://www.cohart.com/penieltheartist/profile','approved','researched',false,'Lagos'),
 ('anthony-azekwoh','Anthony Azekwoh','Anthony Azekwoh','unclaimed+anthony@artistinnigeria.invalid','','Lagos painter and sculptor producing original, commercial and commissioned work.',array['Abstract & Contemporary','Sculpture & Carving'],array['Lagos'],null,'https://www.anthonyazekwoh.com/','approved','researched',false,'Lagos'),
 ('omolola-coker','Omolola Coker','Omolola Coker','unclaimed+omolola@artistinnigeria.invalid','','Lagos figurative and batik artist accepting enquiries for works and commissions.',array['Fabric & Textile','Abstract & Contemporary'],array['Lagos'],'https://instagram.com/burntexpression','https://www.cokerdesignstudio.com/','approved','researched',false,'Lagos'),
 ('artist-kelle','Artist Kelle','Isaac Ekele','unclaimed+kelle@artistinnigeria.invalid','','Abuja portrait specialist working in graphite, charcoal and memorial portraiture.',array['Portrait'],array['FCT Abuja'],null,'https://www.artistkelle.com/','approved','researched',false,'FCT Abuja'),
 ('nathan-emorey','Nathan Emorey','Nathan Emorey','unclaimed+nathan@artistinnigeria.invalid','','Muralist and fine artist with documented projects in Abuja and Lagos.',array['Mural','Abstract & Contemporary'],array['FCT Abuja','Lagos'],null,'https://nathanemorey.com/','approved','researched',false,'FCT Abuja'),
 ('kelechi-emeka-okereke','Okereke Art','Kelechi Emeka-Okereke','unclaimed+okereke@artistinnigeria.invalid','','Multidisciplinary artist working between Port Harcourt and Lagos in abstraction, cubism and portraiture.',array['Portrait','Abstract & Contemporary'],array['Rivers','Lagos'],'https://instagram.com/0kereke','https://okerekeart.store/pages/about-the-artist','approved','researched',false,'Rivers'),
 ('prince-obasi','Prince Obasi','Prince Obasi','unclaimed+princeobasi@artistinnigeria.invalid','','Port Harcourt-based contemporary painter combining acrylic and charcoal.',array['Abstract & Contemporary'],array['Rivers'],null,'https://www.louisimoneguirandou.gallery/en/artists/119-prince-obasi/overview/','approved','researched',false,'Rivers'),
 ('tunde-odunlade','Tunde Odunlade / TOACC','Tunde Odunlade','unclaimed+tunde@artistinnigeria.invalid','','Ibadan artist and gallery founder working in batik, textile art and mixed media.',array['Fabric & Textile','Abstract & Contemporary'],array['Oyo'],null,'https://www.tundeodunladearts.com/about','approved','researched',false,'Oyo'),
 ('egho-art-kulture','Egho Art Kulture','Eghosa Raymond Akenbor','unclaimed+egho@artistinnigeria.invalid','','Benin City painter working in experimental and contemporary abstraction.',array['Abstract & Contemporary'],array['Edo'],null,'https://eghoartkulture.com/','approved','researched',false,'Edo'),
 ('mike-akpan','Mike Akpan','Mike Akpan','unclaimed+mikeakpan@artistinnigeria.invalid','','Uyo-based painter producing original abstract work and commissioned paintings.',array['Abstract & Contemporary'],array['Akwa Ibom'],null,'https://mikeakpan.art/','approved','researched',false,'Akwa Ibom'),
 ('peter-ojingiri','Peter Ojingiri','Peter Ojingiri','unclaimed+peter@artistinnigeria.invalid','','Ilorin-based contemporary painter represented by Gallery 1957.',array['Abstract & Contemporary'],array['Kwara'],null,'https://www.gallery1957.com/artists/72-peter-ojingiri/','approved','researched',false,'Kwara'),
 ('ini-oluwa','Ini Oluwa','Inioluwa Aboluwarin','unclaimed+ini@artistinnigeria.invalid','','Ile-Ife visual artist exploring solitude, memory, identity and home.',array['Abstract & Contemporary'],array['Osun'],null,'https://www.theinioluwa.com/','approved','researched',false,'Osun'),
 ('oluwatobiloba-fasalejo','Oluwatobiloba Fasalejo','Oluwatobiloba Fasalejo','unclaimed+fasalejo@artistinnigeria.invalid','','Ondo-based acrylic and mixed-media visual artist.',array['Abstract & Contemporary'],array['Ondo'],'https://instagram.com/oluwatobiloba__fasalejo','https://oluwatobilobaonfasalejo.lovable.app/','approved','researched',false,'Ondo'),
 ('umanographics','UmanoGraphics Studio','Nnanna Okorie Uma','unclaimed+umano@artistinnigeria.invalid','','Multidisciplinary studio with documented portrait and mural projects in Cross River, Imo and Anambra.',array['Portrait','Mural','Abstract & Contemporary'],array['Cross River','Imo','Anambra'],'https://instagram.com/umanographics','https://www.umanographics.com/','approved','researched',false,null),
 ('molten-metal-studios','Molten Metal Studios','Dr. Ola-Olu Bale','unclaimed+molten@artistinnigeria.invalid','','Commissioned sculpture and steel-fabrication studio with documented work across Lagos, Abuja and Kaduna.',array['Sculpture & Carving'],array['Lagos','FCT Abuja','Kaduna'],null,'https://moltenmetal.ng/','approved','researched',false,null),
 ('ovie-makeup-effects','Ovie Makeup Effects','Odanibe Ovie','unclaimed+ovie@artistinnigeria.invalid','','Nigerian film and television special-effects makeup professional. State location awaits confirmation.',array['SFX & Makeup'],array[]::text[],'https://instagram.com/Ovie_makeup_effect','https://oviemakeupeffect.com/','approved','researched',false,null)
on conflict(slug) do nothing;

update public.artists set verification_state='researched',bookable=false,base_state='Bayelsa' where slug='beo-art-studio' and owner_user_id is null;

create or replace function public.approve_artist_claim(p_claim_id uuid,p_reviewer uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare claimed public.artist_claims%rowtype;
begin
  select * into claimed from public.artist_claims where id=p_claim_id and status='pending' for update;
  if not found then raise exception 'Pending claim not found'; end if;
  if exists(select 1 from public.artists where owner_user_id=claimed.claimant_user_id and id<>claimed.artist_id) then raise exception 'Claimant already owns an artist profile'; end if;
  update public.artists set owner_user_id=claimed.claimant_user_id,verification_state='claimed',bookable=false,updated_at=now() where id=claimed.artist_id and owner_user_id is null and verification_state='researched';
  if not found then raise exception 'Artist is no longer claimable'; end if;
  update public.artist_claims set status='published',reviewed_by=p_reviewer,reviewed_at=now() where id=claimed.id;
  update public.artist_claims set status='rejected',reviewed_by=p_reviewer,reviewed_at=now() where artist_id=claimed.artist_id and id<>claimed.id and status='pending';
  update public.profiles set role='artist',updated_at=now() where user_id=claimed.claimant_user_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_reviewer,'artist.claim.approved','artist',claimed.artist_id::text,jsonb_build_object('claim_id',claimed.id,'claimant_user_id',claimed.claimant_user_id));
  return claimed.artist_id;
end $$;
revoke all on function public.approve_artist_claim(uuid,uuid) from public,anon,authenticated;
grant execute on function public.approve_artist_claim(uuid,uuid) to service_role;

create or replace function public.record_paystack_charge(p_event_key text,p_reference text,p_amount bigint,p_currency text,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare attempt public.payment_attempts%rowtype; booked public.bookings%rowtype;
begin
  if exists(select 1 from public.paystack_events where event_key=p_event_key) then return false; end if;
  select * into attempt from public.payment_attempts where reference=p_reference for update;
  if not found or attempt.amount_kobo<>p_amount or attempt.currency<>p_currency then raise exception 'Payment amount or currency mismatch'; end if;
  if attempt.status='success' then return false; end if;
  select * into booked from public.bookings where id=attempt.booking_id for update;
  if booked.status not in ('quote_accepted','payment_pending') then raise exception 'Booking is not awaiting payment'; end if;
  insert into public.paystack_events(event_key,event_type,payload) values(p_event_key,'charge.success',p_payload);
  update public.payment_attempts set status='success',paid_at=now(),provider_payload=p_payload,updated_at=now() where id=attempt.id;
  update public.bookings set status='funded',funded_at=coalesce(funded_at,now()),updated_at=now() where id=booked.id and status in ('quote_accepted','payment_pending');
  insert into public.booking_status_history(booking_id,from_status,to_status,reason) values(booked.id,booked.status,'funded','Verified Paystack payment') on conflict do nothing;
  insert into public.ledger_entries(booking_id,payment_attempt_id,account,direction,amount_kobo,currency,reference) values
    (booked.id,attempt.id,'customer_funds','debit',booked.customer_total_kobo,booked.currency,p_reference||':cash'),
    (booked.id,attempt.id,'artist_payable','credit',booked.artist_entitlement_kobo,booked.currency,p_reference||':artist'),
    (booked.id,attempt.id,'platform_revenue','credit',booked.platform_fee_kobo,booked.currency,p_reference||':platform')
  on conflict do nothing;
  return true;
end $$;
revoke all on function public.record_paystack_charge(text,text,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_paystack_charge(text,text,bigint,text,jsonb) to service_role;
