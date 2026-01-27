-- ============================================
-- Supabase: profile FK cleanup + performance indexes
-- Purpose:
-- 1) Ensure exactly ONE FK from role tables -> profiles.id (fixes embed ambiguity)
-- 2) Add indexes for faster profile and feed loads
-- Safe to run multiple times
-- ============================================

-- 0) Helper DO block: remove duplicate FKs for <table>.profile_id -> profiles.id
DO $$
DECLARE
  t text;
  dup record;
BEGIN
  FOREACH t IN ARRAY ARRAY['artists','engineers','producers','stoodioz','labels'] LOOP
    -- Skip if table missing
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    -- Drop all but one FK from <table>.profile_id -> profiles.id
    FOR dup IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = t
        AND a.attname = 'profile_id'
        AND c.confrelid = 'public.profiles'::regclass
      ORDER BY c.conname
      OFFSET 1
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, dup.conname);
    END LOOP;

    -- Ensure a single FK exists (create if missing)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND rel.relname = t
        AND a.attname = 'profile_id'
        AND c.confrelid = 'public.profiles'::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE',
        t, t || '_profile_id_fkey'
      );
    END IF;
  END LOOP;
END $$;

-- 1) Profile lookup indexes
CREATE INDEX IF NOT EXISTS artists_profile_id_idx ON public.artists(profile_id);
CREATE INDEX IF NOT EXISTS engineers_profile_id_idx ON public.engineers(profile_id);
CREATE INDEX IF NOT EXISTS producers_profile_id_idx ON public.producers(profile_id);
CREATE INDEX IF NOT EXISTS stoodioz_profile_id_idx ON public.stoodioz(profile_id);
CREATE INDEX IF NOT EXISTS labels_profile_id_idx ON public.labels(profile_id);

-- 2) Feed + follow performance indexes
CREATE INDEX IF NOT EXISTS posts_author_id_created_at_idx ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);

-- ============================================
-- DONE
-- ============================================
