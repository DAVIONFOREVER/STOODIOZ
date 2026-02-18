# Supabase Advisor — Manual Steps (Views & Functions)

The migration `20260218_advisor_fixes.sql` fixes RLS, policies, and materialized view access. Two categories must be done **manually** in the Supabase SQL Editor because they depend on the current database state.

---

## 1) SECURITY DEFINER views → SECURITY INVOKER

**Advisor:** Views with `SECURITY DEFINER` run with the creator’s privileges and bypass RLS.

**Affected views:**  
`stoodioz_v`, `artists_by_profile`, `producers_v`, `v_profile_views_daily`, `artists_v`, `labels_v`, `engineers_v`, `label_budget_overview`, `v_post_likes_daily`

**Fix:** Recreate each view **without** `SECURITY DEFINER` (so it uses the default `SECURITY INVOKER`).

### Step 1 — List view definitions

Run in **SQL Editor**:

```sql
SELECT
  c.relname AS view_name,
  pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN (
    'stoodioz_v', 'artists_by_profile', 'producers_v', 'v_profile_views_daily',
    'artists_v', 'labels_v', 'engineers_v', 'label_budget_overview', 'v_post_likes_daily'
  );
```

### Step 2 — For each view

1. Copy the `definition` (the `SELECT ...` part).
2. Drop the view:  
   `DROP VIEW IF EXISTS public.<view_name> CASCADE;`
3. Recreate **without** `SECURITY DEFINER`:  
   `CREATE VIEW public.<view_name> AS <definition>;`  
   (Do not add `WITH (security_invoker = true)` unless you’re on Postgres 15+; just omit definer so it defaults to invoker.)

If you use **Postgres 15+**, you can force invoker semantics:

```sql
CREATE VIEW public.<view_name> WITH (security_invoker = true) AS <definition>;
```

---

## 2) Functions — set immutable `search_path`

**Advisor:** Functions without a set `search_path` can be affected by the caller’s search path.

**Fix:** Set `search_path = public, pg_catalog` on each affected function.

### Option A — Generate ALTER statements (recommended)

Run in **SQL Editor** to list functions that don’t set `search_path` and generate `ALTER` statements:

```sql
SELECT
  'ALTER FUNCTION ' || n.nspname || '.' || p.proname || '(' ||
  pg_get_function_identity_arguments(p.oid) || ') SET search_path = public, pg_catalog;' AS alter_sql
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path%'));
```

Copy the resulting `alter_sql` lines and run them in the SQL Editor.

### Option B — Apply to known function names

If Advisor listed specific functions (e.g. `get_label_budget_overview`, `sync_profiles_from_engineers`, `toggle_follow`, `set_updated_at`), you can set `search_path` one by one. Example:

```sql
-- Example; replace with your function name and full argument list
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;
```

To get the exact signature for a function:

```sql
SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'set_updated_at';
```

Then:

```sql
ALTER FUNCTION public.set_updated_at(<args>) SET search_path = public, pg_catalog;
```

---

## What to tell Supabase (or an AI) to do

You can paste this into Supabase’s AI or a support request:

- **Apply the migration** `supabase/migrations/20260218_advisor_fixes.sql` (RLS, policies, materialized view revokes, drop permissive policies, add safe replacement policies). Do not change `rooms` policies from the existing migration that fixed stoodio/booking.
- **Views:** Recreate all listed `SECURITY DEFINER` views as normal views (no definer; invoker semantics) using the current view definitions from the database.
- **Functions:** For every public function that doesn’t set `search_path`, run `ALTER FUNCTION ... SET search_path = public, pg_catalog` (using the correct full signature for each function).

---

## After running the migration

1. Run **20260218_advisor_fixes.sql** in the Supabase SQL Editor (or via `supabase db push` / your CI).
2. Complete the **manual steps** above for views and functions.
3. Re-run the **Advisor** in the dashboard and fix any remaining issues.

**If something breaks:**

- **notifications:** The migration assumes `public.notifications` has a `profile_id` column (recipient). If your table uses `user_id` or `recipient_id`, drop the policy and create one that uses the correct column.
- **subscriptions:** The migration only runs if `public.subscriptions` exists and uses `profile_id`; if your column is different, adjust the policy in the migration or run a small fix in the SQL Editor.
- **Bookings:** If label/stoodio create bookings “on behalf of” another user, the current INSERT policy only allows `booked_by_id = auth.uid()`. You may need an extra INSERT policy for label/stoodio (e.g. `label_profile_id = auth.uid() OR stoodio_id = auth.uid()`).
