-- Allow owners to UPDATE and INSERT their own row on role tables (useProfile: is_available, show_on_map, image_url, bio, etc.)
-- Engineers, Artists, Producers, Labels had only SELECT (allow_public_read_directory); updates were blocked by RLS.
-- Stoodioz already has stoodioz_update_own / stoodioz_insert_own from 20260127.

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
