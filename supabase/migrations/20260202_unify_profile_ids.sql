-- ============================================
-- Unify public content tables on profiles.id
-- Option B: use profiles.id everywhere
-- Safe to run multiple times
-- ============================================

-- Helper: role_id -> profile_id mapping
-- (role tables store profile_id)
-- We'll use this CTE in each update block.

DO $$
BEGIN
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

    -- Drop existing FKs on posts.author_id
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

    -- Add FK to profiles
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id);
  END IF;

  -- FOLLOWS: follower_id/following_id -> profiles.id
  IF to_regclass('public.follows') IS NOT NULL THEN
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
    UPDATE public.follows f
      SET follower_id = m.profile_id
      FROM role_map m
      WHERE f.follower_id = m.role_id
        AND f.follower_id <> m.profile_id;

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
    UPDATE public.follows f
      SET following_id = m.profile_id
      FROM role_map m
      WHERE f.following_id = m.role_id
        AND f.following_id <> m.profile_id;

    -- Drop existing FKs on follows.follower_id/following_id
    FOR conname IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = 'follows'
        AND a.attname IN ('follower_id','following_id')
    LOOP
      EXECUTE format('ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS %I', conname);
    END LOOP;

    ALTER TABLE public.follows
      ADD CONSTRAINT follows_follower_id_fkey
      FOREIGN KEY (follower_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    ALTER TABLE public.follows
      ADD CONSTRAINT follows_following_id_fkey
      FOREIGN KEY (following_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows (follower_id);
    CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);
  END IF;

  -- ROOMS: stoodio_id -> profiles.id (was stoodioz.id)
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

    -- Update RLS policy to use profiles.id
    DROP POLICY IF EXISTS "allow_stoodio_manage_own_rooms" ON public.rooms;
    CREATE POLICY "allow_stoodio_manage_own_rooms" ON public.rooms FOR ALL
      USING (auth.uid() = rooms.stoodio_id)
      WITH CHECK (auth.uid() = rooms.stoodio_id);
  END IF;

  -- STOODIOZ.in_house_engineers: engineer_id -> profiles.id (jsonb array)
  IF to_regclass('public.stoodioz') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'stoodioz'
         AND column_name = 'in_house_engineers'
     ) THEN
    UPDATE public.stoodioz s
      SET in_house_engineers = (
        SELECT jsonb_agg(
          CASE
            WHEN e.profile_id IS NOT NULL THEN
              jsonb_set(elem, '{engineer_id}', to_jsonb(e.profile_id))
            ELSE elem
          END
        )
        FROM jsonb_array_elements(coalesce(s.in_house_engineers, '[]'::jsonb)) elem
        LEFT JOIN public.engineers e ON e.id = (elem->>'engineer_id')::uuid
      )
    WHERE s.in_house_engineers IS NOT NULL;
  END IF;

  -- REVIEWS: role ids -> profiles.id
  IF to_regclass('public.reviews') IS NOT NULL THEN
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
    UPDATE public.reviews r
      SET stoodio_id = m.profile_id
      FROM role_map m
      WHERE r.stoodio_id = m.role_id
        AND r.stoodio_id <> m.profile_id;

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
    UPDATE public.reviews r
      SET engineer_id = m.profile_id
      FROM role_map m
      WHERE r.engineer_id = m.role_id
        AND r.engineer_id <> m.profile_id;

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
    UPDATE public.reviews r
      SET producer_id = m.profile_id
      FROM role_map m
      WHERE r.producer_id = m.role_id
        AND r.producer_id <> m.profile_id;

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
    UPDATE public.reviews r
      SET artist_id = m.profile_id
      FROM role_map m
      WHERE r.artist_id = m.role_id
        AND r.artist_id <> m.profile_id;

    -- Drop existing FKs on reviews role columns
    FOR conname IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = 'reviews'
        AND a.attname IN ('stoodio_id','engineer_id','producer_id','artist_id')
    LOOP
      EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS %I', conname);
    END LOOP;

    -- Add FKs to profiles (nullable)
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_stoodio_profile_fkey
      FOREIGN KEY (stoodio_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_engineer_profile_fkey
      FOREIGN KEY (engineer_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_producer_profile_fkey
      FOREIGN KEY (producer_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_artist_profile_fkey
      FOREIGN KEY (artist_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;

  -- MIXING SAMPLES: engineer_id -> profiles.id (keep column, change FK)
  IF to_regclass('public.mixing_samples') IS NOT NULL THEN
    WITH role_map AS (
      SELECT id AS role_id, profile_id FROM public.engineers WHERE profile_id IS NOT NULL
    )
    UPDATE public.mixing_samples ms
      SET engineer_id = m.profile_id
      FROM role_map m
      WHERE ms.engineer_id = m.role_id
        AND ms.engineer_id <> m.profile_id;

    -- Drop existing FK on mixing_samples.engineer_id
    FOR conname IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = 'mixing_samples'
        AND a.attname = 'engineer_id'
    LOOP
      EXECUTE format('ALTER TABLE public.mixing_samples DROP CONSTRAINT IF EXISTS %I', conname);
    END LOOP;

    ALTER TABLE public.mixing_samples
      ADD CONSTRAINT mixing_samples_engineer_profile_fkey
      FOREIGN KEY (engineer_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS mixing_samples_engineer_profile_idx ON public.mixing_samples (engineer_id);
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
