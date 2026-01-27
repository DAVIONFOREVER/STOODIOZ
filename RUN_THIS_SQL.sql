-- ============================================
-- COMPLETE MIGRATION SQL - RUN THIS ONCE
-- ============================================
-- Copy everything below and paste into Supabase SQL Editor
-- Then click "Run" button
-- ============================================

-- Migration 1: Create unregistered_studios table
-- Unregistered studios table for studios found via Google Places API
-- These studios appear on the map but haven't joined Stoodioz yet
create table if not exists public.unregistered_studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  zip_code text,
  country text default 'United States',
  coordinates jsonb not null, -- { lat: number, lon: number }
  email text,
  phone text,
  website_url text,
  google_place_id text unique, -- Google Places API place_id
  google_business_url text,
  business_status text, -- OPERATIONAL, CLOSED_PERMANENTLY, etc.
  rating numeric,
  user_ratings_total integer,
  types jsonb, -- Array of place types from Google
  last_invited_at timestamptz,
  invite_count integer default 0,
  invited_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Mark as registered when they join
  registered_profile_id uuid references public.profiles(id) on delete set null,
  is_registered boolean default false
);

-- Note: The coordinates index might need adjustment based on your PostGIS setup
-- If this fails, you can skip this index - it's just for performance
-- create index if not exists unregistered_studios_coordinates_idx 
--   on public.unregistered_studios using gist (
--     (coordinates::point)
--   );

create index if not exists unregistered_studios_google_place_id_idx 
  on public.unregistered_studios (google_place_id);

create index if not exists unregistered_studios_is_registered_idx 
  on public.unregistered_studios (is_registered);

create index if not exists unregistered_studios_state_city_idx 
  on public.unregistered_studios (state, city);

-- RLS: Public read access, authenticated users can invite
alter table public.unregistered_studios enable row level security;

-- Drop policies if they exist to avoid errors
DROP POLICY IF EXISTS "Anyone can view unregistered studios" ON public.unregistered_studios;
DROP POLICY IF EXISTS "Authenticated users can invite studios" ON public.unregistered_studios;

create policy "Anyone can view unregistered studios"
  on public.unregistered_studios for select
  using (true);

create policy "Authenticated users can invite studios"
  on public.unregistered_studios for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Function to mark studio as registered when they join
create or replace function public.mark_studio_as_registered(
  studio_id uuid,
  profile_id uuid
) returns void as $$
begin
  update public.unregistered_studios
  set 
    is_registered = true,
    registered_profile_id = profile_id,
    updated_at = now()
  where id = studio_id;
end;
$$ language plpgsql security definer;

-- Migration 2: Allow profile deletion
-- Allow authenticated users to delete their own profile
-- This was missing, causing DELETE operations to be blocked by RLS

DROP POLICY IF EXISTS "allow_own_profile_delete" ON public.profiles;
CREATE POLICY "allow_own_profile_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- DONE! 
-- ============================================
-- If you see "Success. No rows returned" - that's perfect!
-- The migrations are now applied to your database.
-- ============================================
