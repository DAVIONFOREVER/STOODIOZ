-- Fix one user who signed up as Label but has profile.role = 'ARTIST'.
-- 1. Replace THEIR_PROFILE_ID with their UUID (from Supabase Table Editor → profiles, or Auth → Users → User UID).
-- 2. Replace 'Label Name' with the label/company name to show.
-- 3. Run in Supabase → SQL Editor.

UPDATE public.profiles
SET role = 'LABEL', updated_at = now()
WHERE id = 'THEIR_PROFILE_ID';

INSERT INTO public.labels (profile_id, name)
SELECT 'THEIR_PROFILE_ID'::uuid, 'Label Name'
WHERE NOT EXISTS (SELECT 1 FROM public.labels WHERE profile_id = 'THEIR_PROFILE_ID'::uuid);
