-- ============================================
-- Add ALL missing columns to ALL role tables
-- So every user type (artist, producer, engineer, stoodio, label) has full schema
-- Plus missing social/related tables the app uses
-- ============================================

-- ---------------------------------------------------------------------------
-- CREATE ROLE TABLES IF NOT EXISTS (so all user types have tables on fresh DBs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text DEFAULT '',
  profile_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.engineers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text DEFAULT '',
  profile_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.producers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text DEFAULT '',
  profile_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.stoodioz (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text DEFAULT '',
  profile_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.labels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text DEFAULT '',
  profile_id uuid REFERENCES public.profiles(id)
);

-- ---------------------------------------------------------------------------
-- ARTISTS (fetchFullRoleRow + getAllPublicUsers + useProfile)
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
-- PRODUCERS
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
-- ENGINEERS
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
-- STOODIOZ (studio-specific: photos, description, location, verification, rates, etc.)
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
-- LABELS
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
-- SOCIAL / RELATED TABLES (post_likes, post_comments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_profile_id_idx ON public.post_likes(profile_id);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_profile_id_idx ON public.post_comments(profile_id);

-- ---------------------------------------------------------------------------
-- LABEL_TRANSACTIONS (artist_id for tips) — only if table exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.label_transactions') IS NOT NULL THEN
    ALTER TABLE public.label_transactions
      ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE (all user types)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS artists_rating_overall_idx ON public.artists(rating_overall);
CREATE INDEX IF NOT EXISTS artists_sessions_completed_idx ON public.artists(sessions_completed);
CREATE INDEX IF NOT EXISTS artists_ranking_tier_idx ON public.artists(ranking_tier);
CREATE INDEX IF NOT EXISTS artists_profile_id_idx ON public.artists(profile_id);

CREATE INDEX IF NOT EXISTS producers_rating_overall_idx ON public.producers(rating_overall);
CREATE INDEX IF NOT EXISTS producers_profile_id_idx ON public.producers(profile_id);

CREATE INDEX IF NOT EXISTS engineers_rating_overall_idx ON public.engineers(rating_overall);
CREATE INDEX IF NOT EXISTS engineers_profile_id_idx ON public.engineers(profile_id);

CREATE INDEX IF NOT EXISTS stoodioz_rating_overall_idx ON public.stoodioz(rating_overall);
CREATE INDEX IF NOT EXISTS stoodioz_profile_id_idx ON public.stoodioz(profile_id);

CREATE INDEX IF NOT EXISTS labels_rating_overall_idx ON public.labels(rating_overall);
CREATE INDEX IF NOT EXISTS labels_profile_id_idx ON public.labels(profile_id);

-- ============================================
-- DONE — all user types have all missing columns and tables
-- ============================================
