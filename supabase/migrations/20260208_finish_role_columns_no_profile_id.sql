-- ============================================
-- FINISH: Add remaining columns and indexes
-- NO profile_id references on role tables (assume phase 1 already added them)
-- Run this after profile_id + profile_id indexes exist on artists, producers, engineers, stoodioz, labels
-- ============================================

-- ---------------------------------------------------------------------------
-- 1. ARTISTS (non-profile_id columns only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
  ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_on_streak boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_hire_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_rank_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchased_masterclass_ids uuid[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 2. PRODUCERS (non-profile_id columns only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.producers
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
  ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instrumentals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_on_streak boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_hire_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_rank_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchased_masterclass_ids uuid[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 3. ENGINEERS (non-profile_id columns only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.engineers
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_on_streak boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_hire_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_rank_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchased_masterclass_ids uuid[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 4. STOODIOZ (non-profile_id columns only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.stoodioz
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
  ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_address text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS availability text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS engineer_pay_rate numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS in_house_engineers jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_on_streak boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_hire_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_rank_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchased_masterclass_ids uuid[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 5. LABELS (non-profile_id columns only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.labels
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_on_streak boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_hire_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_rank_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchased_masterclass_ids uuid[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 6. NON-PROFILE_ID INDEXES (safe — no profile_id column reference)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS artists_rating_overall_idx ON public.artists(rating_overall);
CREATE INDEX IF NOT EXISTS artists_sessions_completed_idx ON public.artists(sessions_completed);
CREATE INDEX IF NOT EXISTS artists_ranking_tier_idx ON public.artists(ranking_tier);

CREATE INDEX IF NOT EXISTS producers_rating_overall_idx ON public.producers(rating_overall);

CREATE INDEX IF NOT EXISTS engineers_rating_overall_idx ON public.engineers(rating_overall);

CREATE INDEX IF NOT EXISTS stoodioz_rating_overall_idx ON public.stoodioz(rating_overall);

CREATE INDEX IF NOT EXISTS labels_rating_overall_idx ON public.labels(rating_overall);

-- ---------------------------------------------------------------------------
-- 7. SOCIAL TABLES (post_likes, post_comments) — run 20260208_social_tables_conditional.sql
--    separately so FKs only run when public.profiles and public.posts exist with id.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 8. LABEL_TRANSACTIONS.artist_id (only if table exists)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.label_transactions') IS NOT NULL THEN
    ALTER TABLE public.label_transactions
      ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- ============================================
-- DONE — finish migration (no profile_id on role tables)
-- ============================================
