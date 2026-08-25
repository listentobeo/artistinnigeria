-- One-time owner role migration for the existing Artist in Nigeria account.
-- Run this file in the Supabase SQL Editor, then sign out and sign in again.
do $$
declare
  owner_id constant uuid := 'd7009652-3a51-4b1c-847e-2322dc2c3839';
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  where id = owner_id and lower(email) = 'odekeb9@gmail.com';

  if not found then
    raise exception 'Owner account was not found. No administrator role was assigned.';
  end if;

  insert into public.profiles (user_id, role, full_name)
  values (owner_id, 'admin', 'Benjamin Odeke')
  on conflict (user_id) do update
  set role = 'admin', updated_at = now();
end $$;
