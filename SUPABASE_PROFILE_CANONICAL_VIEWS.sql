-- ============================================
-- Canonical profile_id usage for all roles
-- Creates UNIQUE(profile_id) and read-only views
-- Safe to run multiple times
-- ============================================

-- 1) Enforce 1:1 mapping between profiles and role tables
CREATE UNIQUE INDEX IF NOT EXISTS artists_profile_id_uniq ON public.artists(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS engineers_profile_id_uniq ON public.engineers(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS producers_profile_id_uniq ON public.producers(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS labels_profile_id_uniq ON public.labels(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS stoodioz_profile_id_uniq ON public.stoodioz(profile_id);

-- 2) Canonical views (profile_id is the primary key for app use)
CREATE OR REPLACE VIEW public.artists_v AS
SELECT
  a.profile_id AS id,
  a.profile_id,
  a.name,
  a.stage_name,
  a.image_url,
  a.cover_image_url,
  a.genres,
  a.rating_overall,
  a.ranking_tier
FROM public.artists a;

CREATE OR REPLACE VIEW public.engineers_v AS
SELECT
  e.profile_id AS id,
  e.profile_id,
  e.name,
  e.image_url,
  e.cover_image_url,
  e.specialties,
  e.rating_overall,
  e.ranking_tier
FROM public.engineers e;

CREATE OR REPLACE VIEW public.producers_v AS
SELECT
  p.profile_id AS id,
  p.profile_id,
  p.name,
  p.image_url,
  p.cover_image_url,
  p.genres,
  p.instrumentals,
  p.rating_overall,
  p.ranking_tier
FROM public.producers p;

CREATE OR REPLACE VIEW public.labels_v AS
SELECT
  l.profile_id AS id,
  l.profile_id,
  l.name,
  l.image_url,
  l.cover_image_url,
  l.rating_overall,
  l.ranking_tier
FROM public.labels l;

CREATE OR REPLACE VIEW public.stoodioz_v AS
SELECT
  s.profile_id AS id,
  s.profile_id,
  s.name,
  s.image_url,
  s.cover_image_url,
  s.genres,
  s.amenities,
  s.rating_overall,
  s.ranking_tier
FROM public.stoodioz s;

-- ============================================
-- DONE
-- ============================================
