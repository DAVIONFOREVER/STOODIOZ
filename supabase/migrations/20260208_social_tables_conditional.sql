-- ============================================
-- SOCIAL TABLES: post_likes, post_comments
-- Only runs when public.profiles and public.posts exist and have PK column "id" (uuid).
-- Repo expects: public.profiles.id (uuid), public.posts.id (uuid).
-- If you got "column profile_id does not exist", run 20260208_inspect_posts_profiles.sql
-- first and confirm the PK column names; if they differ, we must reference those instead.
-- ============================================

DO $$
BEGIN
  -- Require both tables and their PK column "id"
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.posts') IS NULL THEN
    RAISE NOTICE 'Skipping social tables: public.profiles or public.posts does not exist.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id'
  ) THEN
    RAISE NOTICE 'Skipping social tables: profiles or posts does not have column "id". Run 20260208_inspect_posts_profiles.sql to see actual PK columns.';
    RETURN;
  END IF;

  -- Create post_likes (references profiles.id and posts.id)
  CREATE TABLE IF NOT EXISTS public.post_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
  CREATE INDEX IF NOT EXISTS post_likes_profile_id_idx ON public.post_likes(profile_id);

  -- Create post_comments (references profiles.id and posts.id)
  CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    text text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
  CREATE INDEX IF NOT EXISTS post_comments_profile_id_idx ON public.post_comments(profile_id);

  RAISE NOTICE 'Social tables post_likes and post_comments created.';
END $$;
