-- Create rooms table (required for room_photos FK and Stoodio room management).
-- Run before 20260123_create_missing_tables so room_photos can reference rooms(id).
-- Safe to run multiple times (IF NOT EXISTS).

-- stoodioz is assumed to exist (id PK, profile_id). rooms.stoodio_id -> stoodioz.id
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stoodio_id uuid NOT NULL REFERENCES public.stoodioz(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  hourly_rate numeric DEFAULT 0,
  smoking_policy text DEFAULT 'NON_SMOKING',
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rooms_stoodio_id_idx ON public.rooms (stoodio_id);

-- RLS: public read for directory; only the Stoodio owner (via stoodioz.profile_id) can modify.
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_rooms" ON public.rooms;
CREATE POLICY "allow_public_read_rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_stoodio_manage_own_rooms" ON public.rooms;
CREATE POLICY "allow_stoodio_manage_own_rooms" ON public.rooms FOR ALL
  USING (
    (SELECT profile_id FROM public.stoodioz WHERE stoodioz.id = rooms.stoodio_id) = auth.uid()
  )
  WITH CHECK (
    (SELECT profile_id FROM public.stoodioz WHERE stoodioz.id = rooms.stoodio_id) = auth.uid()
  );
