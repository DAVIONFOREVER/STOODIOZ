# What to copy and paste in Supabase

Open **Supabase Dashboard → SQL Editor → New query**. Then use these in order.

---

## Step 1 — Check your tables (optional)

Copy everything below and paste into the SQL Editor, then click **Run**.  
You should see two rows: `public.profiles` and `public.posts` with a column like `id`.

```sql
SELECT
  'public.profiles' AS table_name,
  a.attname AS primary_key_column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND i.indisprimary
  AND a.attnum > 0
  AND NOT a.attisdropped

UNION ALL

SELECT
  'public.posts' AS table_name,
  a.attname AS primary_key_column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'posts'
  AND i.indisprimary
  AND a.attnum > 0
  AND NOT a.attisdropped;
```

---

## Step 2 — Create social tables (post_likes, post_comments) — resilient

Copy everything below and paste into the SQL Editor, then click **Run**.  
Use this if the simple script failed on the profile_id index (e.g. table already existed from an older schema).  
It: creates tables if missing, adds missing columns, adds FKs only if not present, then creates indexes.

```sql
DO $$
DECLARE
  v_has_profiles boolean;
  v_has_posts boolean;
  v_profiles_has_id boolean;
  v_posts_has_id boolean;
  v_has_pl_profile_id boolean;
  v_has_pl_post_id boolean;
  v_has_pc_profile_id boolean;
  v_has_pc_post_id boolean;
BEGIN
  SELECT to_regclass('public.profiles') IS NOT NULL INTO v_has_profiles;
  SELECT to_regclass('public.posts') IS NOT NULL INTO v_has_posts;
  IF NOT v_has_profiles OR NOT v_has_posts THEN
    RAISE NOTICE 'Skipping: profiles or posts table is missing.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='id'
  ) INTO v_profiles_has_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='posts' AND column_name='id'
  ) INTO v_posts_has_id;

  IF NOT v_profiles_has_id OR NOT v_posts_has_id THEN
    RAISE NOTICE 'Skipping: profiles or posts missing id column.';
    RETURN;
  END IF;

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.post_likes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      post_id uuid,
      profile_id uuid,
      created_at timestamptz DEFAULT now()
    )';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.post_comments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      post_id uuid,
      profile_id uuid,
      text text NOT NULL,
      created_at timestamptz DEFAULT now()
    )';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='post_likes' AND column_name='profile_id'
  ) INTO v_has_pl_profile_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='post_likes' AND column_name='post_id'
  ) INTO v_has_pl_post_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='post_comments' AND column_name='profile_id'
  ) INTO v_has_pc_profile_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='post_comments' AND column_name='post_id'
  ) INTO v_has_pc_post_id;

  IF NOT v_has_pl_profile_id THEN
    EXECUTE 'ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS profile_id uuid';
  END IF;
  IF NOT v_has_pl_post_id THEN
    EXECUTE 'ALTER TABLE public.post_likes ADD COLUMN IF NOT EXISTS post_id uuid';
  END IF;
  IF NOT v_has_pc_profile_id THEN
    EXECUTE 'ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS profile_id uuid';
  END IF;
  IF NOT v_has_pc_post_id THEN
    EXECUTE 'ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS post_id uuid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'post_likes'
      AND c.contype = 'f'
      AND c.confrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.post_likes
             ADD CONSTRAINT post_likes_profile_fk
             FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'post_likes'
      AND c.contype = 'f'
      AND c.confrelid = 'public.posts'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.post_likes
             ADD CONSTRAINT post_likes_post_fk
             FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'post_comments'
      AND c.contype = 'f'
      AND c.confrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.post_comments
             ADD CONSTRAINT post_comments_profile_fk
             FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'post_comments'
      AND c.contype = 'f'
      AND c.confrelid = 'public.posts'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.post_comments
             ADD CONSTRAINT post_comments_post_fk
             FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE';
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS post_likes_profile_id_idx ON public.post_likes(profile_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS post_comments_profile_id_idx ON public.post_comments(profile_id)';

  RAISE NOTICE 'Social tables ensured with columns, FKs, and indexes.';
END $$;
```

---

## Step 3 — Rooms visible on stoodio profile (if rooms are missing)

If stoodio profile pages show no rooms and you can’t test booking:

1. **Ensure anyone can read rooms** (so the app can load them when viewing a stoodio). Run:

```sql
DROP POLICY IF EXISTS "allow_public_read_rooms" ON public.rooms;
CREATE POLICY "allow_public_read_rooms" ON public.rooms FOR SELECT USING (true);
```

2. **Optional: point rooms at profile_id** (if rooms exist but still don’t show). Run only if you’ve run the “unify profile ids” migrations and rooms still have `stoodio_id` = stoodioz row id:

```sql
UPDATE public.rooms r
SET stoodio_id = s.profile_id
FROM public.stoodioz s
WHERE r.stoodio_id = s.id
  AND s.profile_id IS NOT NULL
  AND r.stoodio_id <> s.profile_id;
```

3. **Create rooms** – Stoodio owner: open **Stoodio Dashboard** → manage rooms and add at least one room (name, rate, etc.). Rooms are stored with `stoodio_id` = that user’s profile id.

---

## Step 4 — Producer/Engineer availability toggle (if you see “Column may not exist” for is_available)

If the Producer or Engineer dashboard availability toggle logs “Column may not exist in producers table” and only updates local state, add the column:

```sql
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
```

---

**Where:** Supabase Dashboard → **SQL Editor** → **New query** → paste → **Run**.
