-- Fix: Stoodio profile shows rooms and booking works.
-- 1) Let everyone read rooms (otherwise "No rooms listed yet" even when rooms exist).
-- 2) Backfill rooms.stoodio_id to profile_id so the app finds rooms by profile id.
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_rooms" ON public.rooms;
CREATE POLICY "allow_public_read_rooms" ON public.rooms
  FOR SELECT USING (true);

-- Backfill: point rooms to profile_id so fetchFullStoodio finds them (and owner policy works)
UPDATE public.rooms r
SET stoodio_id = s.profile_id
FROM public.stoodioz s
WHERE r.stoodio_id = s.id
  AND s.profile_id IS NOT NULL
  AND r.stoodio_id IS DISTINCT FROM s.profile_id;

-- Owner can manage their own rooms (insert/update/delete)
DROP POLICY IF EXISTS "allow_stoodio_manage_own_rooms" ON public.rooms;
CREATE POLICY "allow_stoodio_manage_own_rooms" ON public.rooms
  FOR ALL
  USING (auth.uid() = stoodio_id)
  WITH CHECK (auth.uid() = stoodio_id);
