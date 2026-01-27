-- ============================================
-- ADD MISSING COLUMNS TO ARTISTS TABLE
-- ============================================
-- Run this in Supabase SQL Editor to add missing columns
-- ============================================

-- Add missing columns to artists table
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
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

-- Add missing columns to producers table
ALTER TABLE public.producers
ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS instrumentals text[] DEFAULT '{}',
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

-- Add missing columns to engineers table
ALTER TABLE public.engineers
ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
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

-- Add missing columns to stoodioz table
ALTER TABLE public.stoodioz
ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
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

-- Add missing columns to labels table
ALTER TABLE public.labels
ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS rating_overall numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_tier text DEFAULT 'PROVISIONAL',
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS artists_rating_overall_idx ON public.artists(rating_overall);
CREATE INDEX IF NOT EXISTS artists_sessions_completed_idx ON public.artists(sessions_completed);
CREATE INDEX IF NOT EXISTS artists_ranking_tier_idx ON public.artists(ranking_tier);

-- Ensure label_transactions supports tips (artist_id)
ALTER TABLE public.label_transactions
ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.profiles(id);

-- Add missing social tables used by the app
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id),
  profile_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id),
  profile_id uuid REFERENCES public.profiles(id),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);

-- ============================================
-- DONE!
-- ============================================
-- After running this, your artists table will have all required columns
-- ============================================
