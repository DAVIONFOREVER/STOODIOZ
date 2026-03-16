-- ============================================================
-- COPY EVERYTHING BELOW INTO SUPABASE: SQL Editor → New query → Paste → Run
-- ============================================================

-- 0) Ensure display_name and full_name exist (required for signup and app)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
UPDATE public.profiles SET display_name = COALESCE(NULLIF(trim(full_name), ''), 'New user') WHERE display_name IS NULL OR trim(display_name) = '';
ALTER TABLE public.profiles ALTER COLUMN display_name SET DEFAULT 'New user';

-- 1) Allow authenticated users to INSERT their own profile (signup)
DROP POLICY IF EXISTS "allow_own_profile_insert" ON public.profiles;
CREATE POLICY "allow_own_profile_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2) Allow signed-in users to SELECT their own profile (login)
DROP POLICY IF EXISTS "allow_own_profile_select" ON public.profiles;
CREATE POLICY "allow_own_profile_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 3) Allow INSERT/UPDATE on role tables (engineers, artists, producers, labels)
-- ENGINEERS
ALTER TABLE public.engineers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "engineers_update_own" ON public.engineers;
CREATE POLICY "engineers_update_own" ON public.engineers
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "engineers_insert_own" ON public.engineers;
CREATE POLICY "engineers_insert_own" ON public.engineers
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- ARTISTS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "artists_update_own" ON public.artists;
CREATE POLICY "artists_update_own" ON public.artists
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "artists_insert_own" ON public.artists;
CREATE POLICY "artists_insert_own" ON public.artists
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- PRODUCERS
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "producers_update_own" ON public.producers;
CREATE POLICY "producers_update_own" ON public.producers
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "producers_insert_own" ON public.producers;
CREATE POLICY "producers_insert_own" ON public.producers
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- LABELS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "labels_update_own" ON public.labels;
CREATE POLICY "labels_update_own" ON public.labels
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "labels_insert_own" ON public.labels;
CREATE POLICY "labels_insert_own" ON public.labels
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
