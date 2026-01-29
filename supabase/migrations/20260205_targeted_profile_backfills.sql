-- ============================================
-- Targeted backfills to profiles.id (safe)
-- Rooms, Instrumentals, Posts
-- ============================================

DO $$
DECLARE
  conname text;
BEGIN
  -- ROOMS: stoodio_id -> profiles.id
  IF to_regclass('public.rooms') IS NOT NULL THEN
    UPDATE public.rooms r
      SET stoodio_id = s.profile_id
      FROM public.stoodioz s
      WHERE r.stoodio_id = s.id
        AND s.profile_id IS NOT NULL
        AND r.stoodio_id <> s.profile_id;

    -- Drop existing FK on rooms.stoodio_id
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
  END IF;

  -- INSTRUMENTALS: producer_id -> profiles.id
  IF to_regclass('public.instrumentals') IS NOT NULL THEN
    UPDATE public.instrumentals i
      SET producer_id = p.profile_id
      FROM public.producers p
      WHERE i.producer_id = p.id
        AND p.profile_id IS NOT NULL
        AND i.producer_id <> p.profile_id;

    -- Drop existing FK on instrumentals.producer_id
    FOR conname IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = 'instrumentals'
        AND a.attname = 'producer_id'
    LOOP
      EXECUTE format('ALTER TABLE public.instrumentals DROP CONSTRAINT IF EXISTS %I', conname);
    END LOOP;

    ALTER TABLE public.instrumentals
      ADD CONSTRAINT instrumentals_producer_id_fkey
      FOREIGN KEY (producer_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS instrumentals_producer_id_idx ON public.instrumentals (producer_id);
  END IF;

  -- POSTS: author_id -> profiles.id
  IF to_regclass('public.posts') IS NOT NULL THEN
    WITH role_map AS (
      SELECT id AS role_id, profile_id FROM public.artists WHERE profile_id IS NOT NULL
      UNION ALL
      SELECT id AS role_id, profile_id FROM public.engineers WHERE profile_id IS NOT NULL
      UNION ALL
      SELECT id AS role_id, profile_id FROM public.producers WHERE profile_id IS NOT NULL
      UNION ALL
      SELECT id AS role_id, profile_id FROM public.stoodioz WHERE profile_id IS NOT NULL
      UNION ALL
      SELECT id AS role_id, profile_id FROM public.labels WHERE profile_id IS NOT NULL
    )
    UPDATE public.posts p
      SET author_id = m.profile_id
      FROM role_map m
      WHERE p.author_id = m.role_id
        AND p.author_id <> m.profile_id;

    -- Drop existing FK on posts.author_id
    FOR conname IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = 'posts'
        AND a.attname = 'author_id'
    LOOP
      EXECUTE format('ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS %I', conname);
    END LOOP;

    ALTER TABLE public.posts
      ADD CONSTRAINT posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id);
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
