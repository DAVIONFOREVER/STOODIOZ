-- Instrumentals: lease tiers (MP3 vs WAV) and exclusive (WAV + stems)
-- price_lease = MP3 lease; price_lease_wav = WAV lease; price_exclusive = WAV + stems

ALTER TABLE public.instrumentals
  ADD COLUMN IF NOT EXISTS price_lease_wav numeric,
  ADD COLUMN IF NOT EXISTS wav_url text,
  ADD COLUMN IF NOT EXISTS stems_url text;

-- Backfill: if price_lease_wav is null, producers can set it in dashboard

-- Producer products: VST presets, drum kits, sample packs, etc. (link or file)
CREATE TABLE IF NOT EXISTS public.producer_products (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('drum_kit', 'vst_preset', 'sample_pack', 'other')),
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  delivery_type text NOT NULL CHECK (delivery_type IN ('link', 'file')),
  delivery_value text NOT NULL,
  preview_url text,
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS producer_products_producer_id_idx ON public.producer_products (producer_id);

ALTER TABLE public.producer_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_producer_products" ON public.producer_products;
CREATE POLICY "allow_public_read_producer_products" ON public.producer_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_producer_manage_own_products" ON public.producer_products;
CREATE POLICY "allow_producer_manage_own_products" ON public.producer_products FOR ALL
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);
