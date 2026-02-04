-- ============================================================
-- ROOMS: DIAGNOSTIC + FIX (run in Supabase SQL Editor)
-- Use this when "no rooms" show on the stoodio page.
-- ============================================================

-- STEP 0: DIAGNOSTIC (run first and check results)
-- How many rooms exist? What are their stoodio_ids?
SELECT 'rooms' AS tbl, COUNT(*) AS cnt FROM public.rooms
UNION ALL
SELECT 'stoodioz', COUNT(*) FROM public.stoodioz;

-- List rooms and whether stoodio_id matches a profile
SELECT
  r.id AS room_id,
  r.name AS room_name,
  r.stoodio_id,
  s.id AS stoodioz_id,
  s.profile_id AS stoodioz_profile_id,
  CASE
    WHEN s.profile_id IS NOT NULL AND r.stoodio_id = s.id THEN 'stoodio_id is stoodioz.id (needs backfill)'
    WHEN s.profile_id IS NOT NULL AND r.stoodio_id = s.profile_id THEN 'stoodio_id is profile_id (OK)'
    WHEN p.id IS NOT NULL THEN 'stoodio_id matches profiles.id (OK)'
    ELSE 'stoodio_id matches nothing?'
  END AS status
FROM public.rooms r
LEFT JOIN public.stoodioz s ON s.id = r.stoodio_id OR s.profile_id = r.stoodio_id
LEFT JOIN public.profiles p ON p.id = r.stoodio_id
ORDER BY r.name;

-- ============================================================
-- STEP 1: Ensure public can read rooms
-- ============================================================
DROP POLICY IF EXISTS "allow_public_read_rooms" ON public.rooms;
CREATE POLICY "allow_public_read_rooms" ON public.rooms FOR SELECT USING (true);

-- ============================================================
-- STEP 2: Backfill rooms.stoodio_id -> profile_id (if still stoodioz.id)
-- ============================================================
UPDATE public.rooms r
SET stoodio_id = s.profile_id
FROM public.stoodioz s
WHERE r.stoodio_id = s.id
  AND s.profile_id IS NOT NULL
  AND r.stoodio_id <> s.profile_id;

-- ============================================================
-- STEP 3: Fix FK (rooms.stoodio_id -> profiles.id)
-- ============================================================
DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND rel.relname = 'rooms'
      AND a.attname = 'stoodio_id'
  LOOP
    EXECUTE format('ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS %I', conname);
  END LOOP;

  ALTER TABLE public.rooms
    ADD CONSTRAINT rooms_stoodio_id_fkey
    FOREIGN KEY (stoodio_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE;

  CREATE INDEX IF NOT EXISTS rooms_stoodio_id_idx ON public.rooms (stoodio_id);

  DROP POLICY IF EXISTS "allow_stoodio_manage_own_rooms" ON public.rooms;
  CREATE POLICY "allow_stoodio_manage_own_rooms" ON public.rooms FOR ALL
    USING (auth.uid() = rooms.stoodio_id)
    WITH CHECK (auth.uid() = rooms.stoodio_id);
END $$;

-- STEP 4: Verify (run after fix)
SELECT 'After fix: rooms count' AS msg, COUNT(*) FROM public.rooms;
SELECT id, name, stoodio_id FROM public.rooms ORDER BY name LIMIT 20;
