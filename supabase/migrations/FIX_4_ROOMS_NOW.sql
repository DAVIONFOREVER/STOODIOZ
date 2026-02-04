-- Run this in Supabase SQL Editor when you have 4 rooms but they don't show on the stoodio page.
-- This forces every room's stoodio_id to the studio's profile_id and ensures read access.

-- 1) Point all rooms to profile_id (whether they currently have stoodioz.id or profile_id)
UPDATE public.rooms r
SET stoodio_id = s.profile_id
FROM public.stoodioz s
WHERE (r.stoodio_id = s.id OR r.stoodio_id = s.profile_id)
  AND s.profile_id IS NOT NULL;

-- 2) Allow everyone to read rooms (so the page can load them)
DROP POLICY IF EXISTS "allow_public_read_rooms" ON public.rooms;
CREATE POLICY "allow_public_read_rooms" ON public.rooms FOR SELECT USING (true);

-- 3) Verify: you should see 4 rows with stoodio_id = a UUID (your profile id)
SELECT id, name, stoodio_id FROM public.rooms ORDER BY name;
