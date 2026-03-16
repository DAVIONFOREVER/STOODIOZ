-- Delete one user completely so they can sign up again (e.g. same email as Label).
-- Replace THEIR_PROFILE_ID with the user's profiles.id (UUID). Same as their Auth → User UID.
--
-- Run in Supabase → SQL Editor. Then delete the auth user: Dashboard → Authentication → Users → find user → ⋮ → Delete user.
-- If you get a foreign key error when deleting from profiles, delete from the table named in the error first (e.g. posts, follows).

-- 1. Role tables
DELETE FROM public.labels WHERE profile_id = 'THEIR_PROFILE_ID';
DELETE FROM public.artists WHERE profile_id = 'THEIR_PROFILE_ID';
DELETE FROM public.engineers WHERE profile_id = 'THEIR_PROFILE_ID';
DELETE FROM public.producers WHERE profile_id = 'THEIR_PROFILE_ID';
DELETE FROM public.stoodioz WHERE profile_id = 'THEIR_PROFILE_ID';

-- 2. Profile row (must be after role tables and any other rows that reference this profile)
DELETE FROM public.profiles WHERE id = 'THEIR_PROFILE_ID';

-- 3. Auth user: Supabase Dashboard → Authentication → Users → find user → ⋮ → Delete user.
--    (Required so the same email can sign up again.)
