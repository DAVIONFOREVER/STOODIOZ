-- Allow a user to insert their own stoodioz row when completing STOODIO setup (profile_id = auth.uid()).
-- Required for: createUser(role=STOODIO) and ensureStoodiozForProfile (RoomManager save room).
ALTER TABLE public.stoodioz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stoodioz_insert_own" ON public.stoodioz;
CREATE POLICY "stoodioz_insert_own" ON public.stoodioz
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Allow owner to update their own stoodioz row (useProfile, in_house_engineers, etc.)
DROP POLICY IF EXISTS "stoodioz_update_own" ON public.stoodioz;
CREATE POLICY "stoodioz_update_own" ON public.stoodioz
  FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
