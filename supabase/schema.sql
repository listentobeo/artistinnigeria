create extension if not exists "pgcrypto";

do $$ begin
  create type public.artist_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_name text not null,
  owner_name text not null,
  email text not null,
  whatsapp text not null,
  bio text not null,
  categories text[] not null default '{}',
  states_served text[] not null default '{}',
  profile_image_url text,
  portfolio_image_urls text[] not null default '{}',
  instagram text,
  portfolio_link text,
  price_range text,
  status public.artist_status not null default 'pending',
  featured boolean not null default false,
  featured_until timestamptz,
  featured_tier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artists add column if not exists featured_until timestamptz;
alter table public.artists add column if not exists featured_tier text;

create index if not exists artists_status_idx on public.artists(status);
create index if not exists artists_states_gin_idx on public.artists using gin(states_served);
alter table public.artists enable row level security;
alter table public.states enable row level security;

drop policy if exists "States are publicly readable" on public.states;
create policy "States are publicly readable" on public.states for select using (true);
drop policy if exists "Approved artists are publicly readable" on public.artists;
create policy "Approved artists are publicly readable" on public.artists for select using (status = 'approved' or auth.role() = 'authenticated');
drop policy if exists "Authenticated admins can update artists" on public.artists;
create policy "Authenticated admins can update artists" on public.artists for update to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artist-portfolios','artist-portfolios',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880;

insert into public.states (name,slug) values
('Abia','abia'),('Adamawa','adamawa'),('Akwa Ibom','akwa-ibom'),('Anambra','anambra'),('Bauchi','bauchi'),('Bayelsa','bayelsa'),('Benue','benue'),('Borno','borno'),('Cross River','cross-river'),('Delta','delta'),('Ebonyi','ebonyi'),('Edo','edo'),('Ekiti','ekiti'),('Enugu','enugu'),('Gombe','gombe'),('Imo','imo'),('Jigawa','jigawa'),('Kaduna','kaduna'),('Kano','kano'),('Katsina','katsina'),('Kebbi','kebbi'),('Kogi','kogi'),('Kwara','kwara'),('Lagos','lagos'),('Nasarawa','nasarawa'),('Niger','niger'),('Ogun','ogun'),('Ondo','ondo'),('Osun','osun'),('Oyo','oyo'),('Plateau','plateau'),('Rivers','rivers'),('Sokoto','sokoto'),('Taraba','taraba'),('Yobe','yobe'),('Zamfara','zamfara'),('FCT Abuja','fct-abuja')
on conflict (slug) do nothing;

insert into public.artists (slug,business_name,owner_name,email,whatsapp,bio,categories,states_served,profile_image_url,instagram,portfolio_link,price_range,status,featured,featured_until,featured_tier)
values ('beo-art-studio','Beo Art Studio','Benjamin Odeke','hello@beoarts.com','2349075424681','Beo Art Studio is a full-service Nigerian art brand creating story-driven custom portraits, large-scale murals, live event paintings, SFX makeup, and fabric art for clients across Nigeria and worldwide.',array['Portrait','Mural','Live Event Painting','SFX & Makeup','Fabric & Textile'],array['Bayelsa','Lagos','Rivers','FCT Abuja'],'/beo-art-studio-logo.png','https://instagram.com/_beoarts','https://www.beoarts.com/p/beo-art-studio-gallery-browse-our.html','₦30,000 – ₦500,000+','approved',true,null,'owner')
on conflict (slug) do nothing;

update public.artists
set whatsapp = '2349075424681',
    instagram = 'https://instagram.com/_beoarts',
    portfolio_link = 'https://www.beoarts.com/p/beo-art-studio-gallery-browse-our.html',
    profile_image_url = '/beo-art-studio-logo.png',
    updated_at = now()
where slug = 'beo-art-studio';
