-- Drop username length check so you can use any username you want.
-- Run in Supabase SQL Editor if you get "profiles_username_length_chk" errors.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_length_chk;
