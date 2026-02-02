# Social tables migration – answer for you and Supabase

## Why “column profile_id does not exist” happened

The social tables step creates `post_likes` and `post_comments`, which reference:

- **`public.profiles`** primary key (expected: **`id`** uuid)
- **`public.posts`** primary key (expected: **`id`** uuid)

The error usually means one of:

1. **Role-table indexes in the same batch**  
   If the migration also creates indexes on role tables (e.g. `CREATE INDEX ... ON artists(profile_id)`), and a role table doesn’t have `profile_id` yet, Postgres fails with “column profile_id does not exist.”  
   **Fix:** Use the “finish” migration that does **not** create any indexes on role tables’ `profile_id`. Create `profile_id` and those indexes in a separate, earlier step (already done).

2. **Different PK column names**  
   If `public.profiles` or `public.posts` use a different primary key column (e.g. `profile_uuid`, `post_id` instead of `id`), then `REFERENCES public.profiles(id)` or `REFERENCES public.posts(id)` can fail.  
   **Fix:** Confirm the actual PK column names (see below) and wire FKs to those columns.

## What this repo expects

| Table              | Primary key column | Type |
|--------------------|--------------------|------|
| `public.profiles`  | **`id`**           | uuid |
| `public.posts`     | **`id`**           | uuid |

All existing migrations and app code assume these. If your Supabase project uses different names, we must reference the correct columns in the social tables.

## How to confirm your schema (for you and Supabase)

Run this in the Supabase SQL Editor (read-only):

**File:** `20260208_inspect_posts_profiles.sql`

It returns the actual primary key column names for `public.profiles` and `public.posts`. If you see something other than `id` for either table, tell me the column names and I’ll wire `post_likes` and `post_comments` to those.

## Migrations to run

1. **Role tables (already done)**  
   - `profile_id` and `profile_id` indexes on artists, producers, engineers, stoodioz, labels.

2. **Finish role columns (no `profile_id` on role tables)**  
   - `20260208_finish_role_columns_no_profile_id.sql`  
   - Adds only non–`profile_id` columns and non–`profile_id` indexes.

3. **Social tables (only when `profiles` and `posts` exist with PK `id`)**  
   - **Option A:** `20260208_social_tables_conditional.sql`  
     - Creates `post_likes` and `post_comments` only if both `public.profiles` and `public.posts` exist and have a column named `id`.  
     - If either table is missing or doesn’t have `id`, it skips and does not fail.  
   - **Option B:** If the inspect script shows different PK column names, say “inspect posts/profiles” and share the result; I’ll give you a migration that references the correct columns.

4. **Optional:** RLS policies for these role and social tables to match your app’s access model.

## Summary for Supabase

- **Expected FK targets:** `public.profiles.id` (uuid), `public.posts.id` (uuid).
- **If “column profile_id does not exist”:** Ensure the failing step is not creating indexes on role tables’ `profile_id` in the same batch as social tables; use the finish migration that omits those indexes.
- **If the failure is on `REFERENCES public.profiles(id)` or `public.posts(id)`:** Run `20260208_inspect_posts_profiles.sql`, confirm PK column names, and use either the conditional social migration (if PK is `id`) or a version that references the correct PK columns.
