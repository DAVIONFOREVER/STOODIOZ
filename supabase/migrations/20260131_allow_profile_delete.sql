-- Allow authenticated users to delete their own profile
-- This was missing, causing DELETE operations to be blocked by RLS

DROP POLICY IF EXISTS "allow_own_profile_delete" ON public.profiles;
CREATE POLICY "allow_own_profile_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);
