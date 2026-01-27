-- Fix photo saving for all profiles (Producer, Artist, Engineer, Stoodio, Label).
-- 1) Ensure profiles has image_url, cover_image_url, avatar_url (used by uploadAvatar/uploadCoverImage).
-- 2) Allow authenticated users to UPDATE their own profile (RLS was blocking; only SELECT existed).
-- 3) Ensure stoodioz has photos column for Stoodio gallery (useProfile writes photos via roleUpdates).

-- Profiles: photo columns (used by apiService.updateUser from uploadAvatar/uploadCoverImage)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Profiles: allow own profile update (required for avatar/cover and any profile edit)
-- Without this, RLS blocks UPDATE; only allow_public_read_directory (SELECT) existed.
DROP POLICY IF EXISTS "allow_own_profile_update" ON public.profiles;
CREATE POLICY "allow_own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Stoodioz: gallery photos (StoodioDashboard Photos tab uses updateProfile({ photos }) -> roleUpdates)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stoodioz') THEN
    ALTER TABLE public.stoodioz ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Storage: allow UPDATE on avatars/covers (upsert:true can overwrite; INSERT alone may be denied on replace)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "Allow authenticated update avatars" ON storage.objects;
    CREATE POLICY "Allow authenticated update avatars" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
    DROP POLICY IF EXISTS "Allow authenticated update covers" ON storage.objects;
    CREATE POLICY "Allow authenticated update covers" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'covers') WITH CHECK (bucket_id = 'covers');
  END IF;
END $$;
