-- Landing page / search results need these so artists, engineers, producers, stoodioz, labels (and profiles) can be read by anyone.
-- Copy into Supabase → SQL Editor → Run. Safe to run multiple times.
-- Without these, the directory loads as empty and you see 0 users on the landing page.

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.artists;
CREATE POLICY "allow_public_read_directory" ON public.artists FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.engineers;
CREATE POLICY "allow_public_read_directory" ON public.engineers FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.producers;
CREATE POLICY "allow_public_read_directory" ON public.producers FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.stoodioz;
CREATE POLICY "allow_public_read_directory" ON public.stoodioz FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.labels;
CREATE POLICY "allow_public_read_directory" ON public.labels FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_read_directory" ON public.profiles;
CREATE POLICY "allow_public_read_directory" ON public.profiles FOR SELECT USING (true);
