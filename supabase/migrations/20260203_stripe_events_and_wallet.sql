-- ============================================
-- Stripe webhook idempotency + wallet fields
-- Safe to run multiple times
-- ============================================

-- Stripe events table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  stripe_created_at timestamptz,
  received_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_event_type_idx ON public.stripe_events (event_type);

-- Wallet fields on profiles (if missing)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_transactions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- ============================================
-- DONE
-- ============================================
