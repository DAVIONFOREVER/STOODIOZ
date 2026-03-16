-- Ensure signed-in users can read their own profile (fixes "Profile not found" when profile exists).
-- Run in Supabase SQL Editor if you see Profile not found on login but the row exists in Table Editor.
DROP POLICY IF EXISTS "allow_own_profile_select" ON public.profiles;
CREATE POLICY "allow_own_profile_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
