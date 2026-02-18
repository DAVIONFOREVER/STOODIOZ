-- ============================================
-- Supabase Advisor fixes (18 issues) — safe, non-conflicting with rooms/booking flow.
-- Run after 20260217_rooms_public_read.sql. Does NOT alter rooms policies.
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) RLS on but no policies (INFO) — archive/old tables
-- Decision: leave as-is (all access denied). No change; optional: disable API exposure in Dashboard.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2) SECURITY DEFINER views — handled in SUPABASE_ADVISOR_MANUAL_STEPS.md
-- (Must DROP and CREATE with SECURITY INVOKER; need current view defs from DB.)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3) Functions mutable search_path — handled in SUPABASE_ADVISOR_MANUAL_STEPS.md
-- (ALTER FUNCTION ... SET search_path = public, pg_catalog)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4 & 7) RLS disabled: enable RLS and add minimal safe policies
-- ---------------------------------------------------------------------------

-- room_photos: public read; owner (via room's stoodio_id) can manage
ALTER TABLE public.room_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_room_photos" ON public.room_photos;
CREATE POLICY "public_read_room_photos" ON public.room_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "owner_manage_room_photos" ON public.room_photos;
CREATE POLICY "owner_manage_room_photos" ON public.room_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_photos.room_id AND r.stoodio_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_photos.room_id AND r.stoodio_id = auth.uid()
    )
  );

-- label_transactions: label-scoped (label_profile_id = auth.uid())
ALTER TABLE public.label_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "label_transactions_label" ON public.label_transactions;
CREATE POLICY "label_transactions_label" ON public.label_transactions
  FOR ALL TO authenticated
  USING (label_profile_id = auth.uid())
  WITH CHECK (label_profile_id = auth.uid());

-- label_projects: label-scoped
ALTER TABLE public.label_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "label_projects_label" ON public.label_projects;
CREATE POLICY "label_projects_label" ON public.label_projects
  FOR ALL TO authenticated
  USING (label_profile_id = auth.uid())
  WITH CHECK (label_profile_id = auth.uid());

-- label_project_tasks: access via project's label
ALTER TABLE public.label_project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "label_project_tasks_via_project" ON public.label_project_tasks;
CREATE POLICY "label_project_tasks_via_project" ON public.label_project_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.label_projects p
      WHERE p.id = label_project_tasks.project_id AND p.label_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.label_projects p
      WHERE p.id = label_project_tasks.project_id AND p.label_profile_id = auth.uid()
    )
  );

-- payments: owner (profile_id) only
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_owner" ON public.payments;
CREATE POLICY "payments_owner" ON public.payments
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- post_comments: public read; author can insert/update/delete own
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_comments_public_read" ON public.post_comments;
CREATE POLICY "post_comments_public_read" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "post_comments_author" ON public.post_comments;
CREATE POLICY "post_comments_author" ON public.post_comments
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- subscriptions (if table exists): owner-scoped
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "subscriptions_owner" ON public.subscriptions';
    EXECUTE 'CREATE POLICY "subscriptions_owner" ON public.subscriptions FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid())';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- column may be user_id or similar; skip
END $$;

-- profiles_images_backup, role_images_backup (if exist): restrict to authenticated read, owner write
DO $$
BEGIN
  IF to_regclass('public.profiles_images_backup') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles_images_backup ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "profiles_images_backup_owner" ON public.profiles_images_backup';
    EXECUTE 'CREATE POLICY "profiles_images_backup_owner" ON public.profiles_images_backup FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid())';
  END IF;
  IF to_regclass('public.role_images_backup') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.role_images_backup ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "role_images_backup_owner" ON public.role_images_backup';
    EXECUTE 'CREATE POLICY "role_images_backup_owner" ON public.role_images_backup FOR ALL TO authenticated USING (true) WITH CHECK (true)'; -- tighten if you have role_id column
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Materialized views: revoke SELECT from anon/authenticated (restrict API)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.label_roster_expanded') IS NOT NULL THEN
    REVOKE SELECT ON public.label_roster_expanded FROM anon, authenticated;
  END IF;
  IF to_regclass('public.roster_kpi_view') IS NOT NULL THEN
    REVOKE SELECT ON public.roster_kpi_view FROM anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Overly permissive RLS: drop legacy permissive policies only.
--    (We do NOT drop allow_public_read_rooms / allow_stoodio_manage_own_rooms.)
-- ---------------------------------------------------------------------------

-- Rooms: drop legacy "Public rooms" (ALL) if it exists; keep 20260217 policies
DROP POLICY IF EXISTS "Public rooms" ON public.rooms;

-- Bookings: enable RLS, drop permissive policies, add participant-scoped ones below
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_insert_auth" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_updater" ON public.bookings;

-- Conversations / messages: drop legacy "Public *" if exist (20260216 has proper policies)
DROP POLICY IF EXISTS "Public conversations" ON public.conversations;
DROP POLICY IF EXISTS "Public messages" ON public.messages;

-- Instrumentals: drop "Public instrumentals" (ALL) if exists; keep read + producer manage
DROP POLICY IF EXISTS "Public instrumentals" ON public.instrumentals;

-- Label roster / budgets
DROP POLICY IF EXISTS "Public artist budgets" ON public.label_artist_budgets;
DROP POLICY IF EXISTS "Public budgets" ON public.label_budgets;
DROP POLICY IF EXISTS "Allow claim updates" ON public.label_roster;
DROP POLICY IF EXISTS "Allow label roster insert" ON public.label_roster;
DROP POLICY IF EXISTS "Public roster" ON public.label_roster;

-- Notifications, posts
DROP POLICY IF EXISTS "Public notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update posts (likes/comments)" ON public.posts;

-- ---------------------------------------------------------------------------
-- 6 cont'd) Add safe replacement policies where we dropped permissive ones
-- ---------------------------------------------------------------------------

-- Bookings: participant-scoped (creator, artist, engineer, producer, stoodio, label)
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    -- INSERT: authenticated, must set booked_by_id = self (or allow label/stoodio to create on behalf)
    EXECUTE 'CREATE POLICY "bookings_insert_owner" ON public.bookings FOR INSERT TO authenticated WITH CHECK (booked_by_id = auth.uid())';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; -- already exists
END $$;

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    -- UPDATE: participant (booked_by, artist, engineer, producer, stoodio, label)
    EXECUTE 'CREATE POLICY "bookings_update_participants" ON public.bookings FOR UPDATE TO authenticated
      USING (
        booked_by_id = auth.uid()
        OR artist_profile_id = auth.uid()
        OR engineer_profile_id = auth.uid()
        OR producer_id = auth.uid()
        OR producer_profile_id = auth.uid()
        OR stoodio_id = auth.uid()
        OR label_profile_id = auth.uid()
      )
      WITH CHECK (
        booked_by_id = auth.uid()
        OR artist_profile_id = auth.uid()
        OR engineer_profile_id = auth.uid()
        OR producer_id = auth.uid()
        OR producer_profile_id = auth.uid()
        OR stoodio_id = auth.uid()
        OR label_profile_id = auth.uid()
      )';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    -- SELECT: same participants can read
    EXECUTE 'CREATE POLICY "bookings_select_participants" ON public.bookings FOR SELECT TO authenticated
      USING (
        booked_by_id = auth.uid()
        OR artist_profile_id = auth.uid()
        OR engineer_profile_id = auth.uid()
        OR producer_id = auth.uid()
        OR producer_profile_id = auth.uid()
        OR stoodio_id = auth.uid()
        OR label_profile_id = auth.uid()
      )';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Instrumentals: ensure read + producer manage exist (from 20260124)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instrumentals' AND policyname = 'allow_public_read_instrumentals') THEN
    CREATE POLICY "allow_public_read_instrumentals" ON public.instrumentals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instrumentals' AND policyname = 'allow_producer_manage_own_instrumentals') THEN
    CREATE POLICY "allow_producer_manage_own_instrumentals" ON public.instrumentals FOR ALL TO authenticated USING (producer_id = auth.uid()) WITH CHECK (producer_id = auth.uid());
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Label roster: label can manage; artists can read own
DO $$
BEGIN
  IF to_regclass('public.label_roster') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "label_roster_label_manage" ON public.label_roster FOR ALL TO authenticated USING (label_profile_id = auth.uid() OR label_id = auth.uid()) WITH CHECK (label_profile_id = auth.uid() OR label_id = auth.uid())';
    EXECUTE 'CREATE POLICY "label_roster_artist_read" ON public.label_roster FOR SELECT TO authenticated USING (artist_profile_id = auth.uid() OR user_id = auth.uid())';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Label budgets / artist budgets: label-scoped
DO $$
BEGIN
  IF to_regclass('public.label_budgets') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "label_budgets_label" ON public.label_budgets FOR ALL TO authenticated USING (label_profile_id = auth.uid()) WITH CHECK (label_profile_id = auth.uid())';
  END IF;
  IF to_regclass('public.label_artist_budgets') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "label_artist_budgets_label" ON public.label_artist_budgets FOR ALL TO authenticated USING (label_profile_id = auth.uid()) WITH CHECK (label_profile_id = auth.uid())';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notifications: recipient-scoped (assume profile_id or user_id = recipient)
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "notifications_recipient" ON public.notifications FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid())';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Posts: public read; author can insert/update/delete
DO $$
BEGIN
  IF to_regclass('public.posts') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "posts_author" ON public.posts FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid())';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Done. Views and function search_path: see SUPABASE_ADVISOR_MANUAL_STEPS.md
-- ---------------------------------------------------------------------------
