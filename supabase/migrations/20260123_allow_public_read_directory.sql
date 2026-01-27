-- Allow public read on directory tables so the landing page and discovery work.
-- When RLS is enabled with no SELECT policy, anon/authenticated get empty results
-- and the app shows: "Profiles are not loading. This is usually caused by Supabase RLS blocking public reads."
--
-- If you get "row-level security is not enabled on table X", enable it first in Dashboard:
--   Table Editor → X → click the table → RLS enabled = ON
-- or in SQL: ALTER TABLE public.X ENABLE ROW LEVEL SECURITY;
--
-- If you get "relation X does not exist", that table may not be in your project;
-- comment out or delete the DROP/CREATE block for that table.

-- artists (getAllPublicUsers, landing page)
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.artists;
CREATE POLICY "allow_public_read_directory" ON public.artists FOR SELECT USING (true);

-- engineers
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.engineers;
CREATE POLICY "allow_public_read_directory" ON public.engineers FOR SELECT USING (true);

-- producers
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.producers;
CREATE POLICY "allow_public_read_directory" ON public.producers FOR SELECT USING (true);

-- stoodioz
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.stoodioz;
CREATE POLICY "allow_public_read_directory" ON public.stoodioz FOR SELECT USING (true);

-- labels
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.labels;
CREATE POLICY "allow_public_read_directory" ON public.labels FOR SELECT USING (true);

-- profiles (used in fetchFullRoleRow joins and getProfileById; anon may need to read for public directory)
DROP POLICY IF EXISTS "allow_public_read_directory" ON public.profiles;
CREATE POLICY "allow_public_read_directory" ON public.profiles FOR SELECT USING (true);
