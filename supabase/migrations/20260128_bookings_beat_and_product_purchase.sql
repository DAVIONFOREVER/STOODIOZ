-- Bookings: support beat purchase tier and product (kit/preset) purchase delivery

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS beat_purchase_type text
    CHECK (beat_purchase_type IS NULL OR beat_purchase_type IN ('lease_mp3', 'lease_wav', 'exclusive')),
  ADD COLUMN IF NOT EXISTS product_purchase jsonb;
