-- Add display_name (and full_name, username) to profiles so signup and app work.
-- Copy into Supabase → SQL Editor → Run. Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Backfill empty display_name from full_name or 'New user'
UPDATE public.profiles
SET display_name = COALESCE(NULLIF(trim(full_name), ''), 'New user')
WHERE display_name IS NULL OR trim(display_name) = '';

-- Optional: set default so new rows get a value if not provided
ALTER TABLE public.profiles ALTER COLUMN display_name SET DEFAULT 'New user';
