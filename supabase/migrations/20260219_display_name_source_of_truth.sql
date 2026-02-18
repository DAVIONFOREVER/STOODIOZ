-- ============================================
-- Single source of truth for display name: public.profiles.display_name
-- App already reads display_name first (getDisplayName, apiService). This backfills
-- NULLs and prevents future NULLs so users always show as their chosen name.
-- ============================================

-- Ensure column exists (Supabase Auth may create profiles without it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- 1) From artists.stage_name or artists.name
UPDATE public.profiles p
SET display_name = COALESCE(a.stage_name, a.name)
FROM public.artists a
WHERE a.profile_id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND (a.stage_name IS NOT NULL AND trim(a.stage_name) <> '' OR a.name IS NOT NULL AND trim(a.name) <> '');

-- 2) From engineers.name (or stage_name if present)
UPDATE public.profiles p
SET display_name = COALESCE(e.stage_name, e.name)
FROM public.engineers e
WHERE e.profile_id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND (e.stage_name IS NOT NULL AND trim(e.stage_name) <> '' OR e.name IS NOT NULL AND trim(e.name) <> '');

-- 3) From producers.name / stage_name
UPDATE public.profiles p
SET display_name = COALESCE(pr.stage_name, pr.name)
FROM public.producers pr
WHERE pr.profile_id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND (pr.stage_name IS NOT NULL AND trim(pr.stage_name) <> '' OR pr.name IS NOT NULL AND trim(pr.name) <> '');

-- 4) From stoodioz.name
UPDATE public.profiles p
SET display_name = COALESCE(s.stage_name, s.name)
FROM public.stoodioz s
WHERE s.profile_id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND (s.stage_name IS NOT NULL AND trim(s.stage_name) <> '' OR s.name IS NOT NULL AND trim(s.name) <> '');

-- 5) From labels.name / stage_name
UPDATE public.profiles p
SET display_name = COALESCE(l.stage_name, l.name)
FROM public.labels l
WHERE l.profile_id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND (l.stage_name IS NOT NULL AND trim(l.stage_name) <> '' OR l.name IS NOT NULL AND trim(l.name) <> '');

-- 6) From profiles.full_name
UPDATE public.profiles p
SET display_name = trim(p.full_name)
WHERE (p.display_name IS NULL OR trim(p.display_name) = '')
  AND p.full_name IS NOT NULL AND trim(p.full_name) <> '';

-- 6b) From profiles.name if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name') THEN
    UPDATE public.profiles p SET display_name = trim(p.name) WHERE (p.display_name IS NULL OR trim(p.display_name) = '') AND p.name IS NOT NULL AND trim(p.name) <> '';
  END IF;
END $$;

-- 7) From auth.users.raw_user_meta_data->>'name'
UPDATE public.profiles p
SET display_name = u.raw_user_meta_data->>'name'
FROM auth.users u
WHERE u.id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND u.raw_user_meta_data ? 'name'
  AND COALESCE(trim(u.raw_user_meta_data->>'name'), '') <> '';

-- 8) Fallback: email local part (before @)
UPDATE public.profiles p
SET display_name = split_part(u.email, '@', 1)
FROM auth.users u
WHERE u.id = p.id
  AND (p.display_name IS NULL OR trim(p.display_name) = '')
  AND u.email IS NOT NULL
  AND trim(split_part(u.email, '@', 1)) <> '';

-- 9) Any remaining NULL or blank: safe default so NOT NULL constraint holds
UPDATE public.profiles SET display_name = 'New user' WHERE display_name IS NULL OR trim(display_name) = '';

-- Prevent future NULLs: default + NOT NULL
ALTER TABLE public.profiles
  ALTER COLUMN display_name SET DEFAULT 'New user',
  ALTER COLUMN display_name SET NOT NULL;

-- Optional: keep role table names in sync when display_name is updated (app can do this on edit; trigger is optional)
-- Uncomment if you want stage_name/name to update when profile display_name is set from profile edit:
-- CREATE OR REPLACE FUNCTION public.sync_role_name_from_display_name()
-- RETURNS trigger LANGUAGE plpgsql AS $$
-- BEGIN
--   IF NEW.display_name IS NOT NULL AND trim(NEW.display_name) <> '' THEN
--     UPDATE public.artists SET stage_name = NEW.display_name WHERE profile_id = NEW.id;
--     UPDATE public.engineers SET name = NEW.display_name WHERE profile_id = NEW.id;
--     UPDATE public.producers SET name = NEW.display_name WHERE profile_id = NEW.id;
--     UPDATE public.stoodioz SET name = NEW.display_name WHERE profile_id = NEW.id;
--     UPDATE public.labels SET name = NEW.display_name WHERE profile_id = NEW.id;
--   END IF;
--   RETURN NEW;
-- END; $$;
-- DROP TRIGGER IF EXISTS trg_sync_role_name_from_display_name ON public.profiles;
-- CREATE TRIGGER trg_sync_role_name_from_display_name AFTER UPDATE OF display_name ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_role_name_from_display_name();
