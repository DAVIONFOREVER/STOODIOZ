-- Label roster: columns for api compatibility, verified badge, drop support
-- Safe to run (IF NOT EXISTS / ADD IF NOT EXISTS).

-- label_roster: add label_profile_id if missing (alias for label_id when label id = profile id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='label_roster' AND column_name='label_profile_id') THEN
    ALTER TABLE public.label_roster ADD COLUMN label_profile_id uuid REFERENCES public.profiles(id);
    UPDATE public.label_roster SET label_profile_id = label_id WHERE label_id IS NOT NULL AND label_profile_id IS NULL;
  END IF;
END $$;

-- label_roster: add artist_profile_id if missing (alias for user_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='label_roster' AND column_name='artist_profile_id') THEN
    ALTER TABLE public.label_roster ADD COLUMN artist_profile_id uuid REFERENCES public.profiles(id);
    UPDATE public.label_roster SET artist_profile_id = user_id WHERE user_id IS NOT NULL AND artist_profile_id IS NULL;
  END IF;
END $$;

-- label_roster: dropped_at for soft drop / audit (when label drops artist, badge is gone; we can soft-delete for history)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='label_roster' AND column_name='dropped_at') THEN
    ALTER TABLE public.label_roster ADD COLUMN dropped_at timestamptz;
  END IF;
END $$;

-- profiles: label-verified badge (true when currently on a label's roster; cleared when dropped)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='label_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN label_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='verified_by_label_id') THEN
    ALTER TABLE public.profiles ADD COLUMN verified_by_label_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- Backfill label_verified from existing roster (user is on a label, not dropped)
UPDATE public.profiles p
SET label_verified = true, verified_by_label_id = COALESCE(r.label_profile_id, r.label_id)
FROM public.label_roster r
WHERE (r.user_id = p.id OR r.artist_profile_id = p.id)
  AND (r.dropped_at IS NULL)
  AND (r.label_profile_id IS NOT NULL OR r.label_id IS NOT NULL);
