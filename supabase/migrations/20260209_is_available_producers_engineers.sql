-- Add is_available to producers and engineers (used by ProducerDashboard / EngineerDashboard availability toggle)
-- Safe to run multiple times

ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
