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

-- ============================================
-- DONE!
-- ============================================
-- After running this, your artists table will have all required columns
-- ============================================
