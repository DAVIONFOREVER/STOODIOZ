-- Ensure profiles has a role column so fetchCurrentUserProfile and complete setup work.
-- createUser sets profile.role on signup; fetchCurrentUserProfile reads it to determine which role table to use.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;
