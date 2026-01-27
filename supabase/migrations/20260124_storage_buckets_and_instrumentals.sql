-- Storage buckets for uploads (avatars, covers, beats, etc.)
-- Run in Supabase SQL Editor if storage.buckets is available.
-- If you get "relation storage.buckets does not exist", create buckets in Dashboard: Storage → New bucket.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
      ('covers', 'covers', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
      ('room-photos', 'room-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
      ('assets', 'assets', true, 52428800, NULL),
      ('documents', 'documents', true, 52428800, ARRAY['application/pdf','image/jpeg','image/png']),
      ('beats', 'beats', true, 104857600, ARRAY['audio/mpeg','audio/wav','audio/mp3']),
      ('mixing-samples', 'mixing-samples', true, 52428800, ARRAY['audio/mpeg','audio/wav','audio/mp3']),
      ('post-attachments', 'post-attachments', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;

    -- Policies: allow authenticated uploads and public read for public buckets
    DROP POLICY IF EXISTS "Allow authenticated upload avatars" ON storage.objects;
    CREATE POLICY "Allow authenticated upload avatars" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'avatars');
    DROP POLICY IF EXISTS "Allow public read avatars" ON storage.objects;
    CREATE POLICY "Allow public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "Allow authenticated upload covers" ON storage.objects;
    CREATE POLICY "Allow authenticated upload covers" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'covers');
    DROP POLICY IF EXISTS "Allow public read covers" ON storage.objects;
    CREATE POLICY "Allow public read covers" ON storage.objects FOR SELECT TO public USING (bucket_id = 'covers');

    DROP POLICY IF EXISTS "Allow authenticated upload room-photos" ON storage.objects;
    CREATE POLICY "Allow authenticated upload room-photos" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'room-photos');
    DROP POLICY IF EXISTS "Allow public read room-photos" ON storage.objects;
    CREATE POLICY "Allow public read room-photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'room-photos');

    DROP POLICY IF EXISTS "Allow authenticated upload assets" ON storage.objects;
    CREATE POLICY "Allow authenticated upload assets" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'assets');
    DROP POLICY IF EXISTS "Allow public read assets" ON storage.objects;
    CREATE POLICY "Allow public read assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'assets');

    DROP POLICY IF EXISTS "Allow authenticated upload documents" ON storage.objects;
    CREATE POLICY "Allow authenticated upload documents" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'documents');
    DROP POLICY IF EXISTS "Allow public read documents" ON storage.objects;
    CREATE POLICY "Allow public read documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');

    DROP POLICY IF EXISTS "Allow authenticated upload beats" ON storage.objects;
    CREATE POLICY "Allow authenticated upload beats" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'beats');
    DROP POLICY IF EXISTS "Allow public read beats" ON storage.objects;
    CREATE POLICY "Allow public read beats" ON storage.objects FOR SELECT TO public USING (bucket_id = 'beats');

    DROP POLICY IF EXISTS "Allow authenticated upload mixing-samples" ON storage.objects;
    CREATE POLICY "Allow authenticated upload mixing-samples" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'mixing-samples');
    DROP POLICY IF EXISTS "Allow public read mixing-samples" ON storage.objects;
    CREATE POLICY "Allow public read mixing-samples" ON storage.objects FOR SELECT TO public USING (bucket_id = 'mixing-samples');

    DROP POLICY IF EXISTS "Allow authenticated upload post-attachments" ON storage.objects;
    CREATE POLICY "Allow authenticated upload post-attachments" ON storage.objects FOR INSERT TO authenticated WITH (bucket_id = 'post-attachments');
    DROP POLICY IF EXISTS "Allow public read post-attachments" ON storage.objects;
    CREATE POLICY "Allow public read post-attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'post-attachments');
  END IF;
END $$;

-- Instrumentals table for producer beat store (if not exists)
CREATE TABLE IF NOT EXISTS public.instrumentals (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text,
  price_lease numeric DEFAULT 29.99,
  price_exclusive numeric DEFAULT 299.99,
  tags jsonb DEFAULT '[]',
  audio_url text,
  cover_art_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instrumentals_producer_id_idx ON public.instrumentals (producer_id);

-- RLS: allow public read for directory, allow authenticated insert/update/delete for own
ALTER TABLE public.instrumentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_instrumentals" ON public.instrumentals;
CREATE POLICY "allow_public_read_instrumentals" ON public.instrumentals FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_producer_manage_own_instrumentals" ON public.instrumentals;
CREATE POLICY "allow_producer_manage_own_instrumentals" ON public.instrumentals FOR ALL
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);
