-- Allow authenticated users to insert their own profile (signup flow: createUser inserts profiles row).
-- Without this, label (and other role) signup fails with RLS blocking INSERT.

DROP POLICY IF EXISTS "allow_own_profile_insert" ON public.profiles;
CREATE POLICY "allow_own_profile_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
