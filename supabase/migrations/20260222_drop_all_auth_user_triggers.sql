-- ============================================
-- Drop ALL triggers on auth.users (fixes signup 500)
-- Run this in Supabase SQL Editor. Our app creates the profile after signup.
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND NOT t.tgisinternal  -- skip internal triggers
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.trigger_name);
    RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
  END LOOP;
END $$;
