-- ============================================
-- App-driven profile creation: drop DB triggers
-- Our app (createUser in apiService) creates the profile after signUp().
-- Duplicate triggers (handle_new_user, create_profile_for_new_user) cause
-- 500 on signup and conflicts. Run this in Supabase SQL Editor.
-- ============================================

-- 1) Optional: see what triggers exist on auth.users
-- SELECT tgname AS trigger_name, proname AS function_name
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 2) Drop triggers on auth.users that insert into public.profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;

-- If Supabase showed different trigger names, drop those too, e.g.:
-- DROP TRIGGER IF EXISTS "your_trigger_name" ON auth.users;

-- ============================================
-- After this: signup only creates auth.users row.
-- Our app then calls createUser() which upsert into public.profiles (allowed by 20260220_profiles_insert_policy).
-- ============================================
