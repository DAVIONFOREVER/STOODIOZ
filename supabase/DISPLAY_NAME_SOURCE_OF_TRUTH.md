# Display name: single source of truth

## 1) What “NULL” means

**NULL** in SQL means “no value” or “unknown.” It is not zero, not an empty string, and not false. If a column is NULL, nothing was stored there.

- To test for NULL you use `IS NULL` or `IS NOT NULL` (e.g. `name IS NULL`), not `= NULL`.
- In the app, when we read “name” and the database returns NULL, the UI has nothing to show, so you may see “User” or blank or an ID.

So when you see “profile_id is null” or “stage_name is null,” it means that field was never set for that row.

---

## 2) Why there are so many “name” options

In this project we have:

| Place | Column(s) | Purpose |
|-------|-----------|--------|
| **public.profiles** | `display_name`, `full_name`, `username` | One row per user; **canonical** display name is `display_name`. |
| **auth.users** | `email`, `raw_user_meta_data->>'name'` | Auth provider data (e.g. from sign-up). |
| **public.artists** | `name`, `stage_name`, `profile_id` | Artist profile; links to `profiles.id` via `profile_id`. |
| **public.engineers** | `name`, `stage_name`, `profile_id` | Same idea for engineers. |
| **public.producers** / **stoodioz** / **labels** | `name`, `stage_name`, `profile_id` | Same for other roles. |

They got out of sync because:

- Sign-up or migrations filled some tables but not others.
- The app sometimes wrote only to a role table (e.g. `artists.stage_name`) and not to `profiles.display_name`.
- Some users were created before we had a single place for “display name.”

So “vijeta” can have a profile row with `display_name` and `username` NULL, and an artist row with `stage_name` NULL, so everywhere we look for a name we get NULL and the app falls back to “User” or similar.

---

## 3) What we use as the one source of truth

In this codebase the **single source of truth for “the name we show in the UI”** is:

- **`public.profiles.display_name`**

The app already uses it first:

- **`utils/getDisplayName.ts`** prefers `display_name`, then `username`, then other fields.
- **`services/apiService.ts`** builds `name` from `display_name ?? username ?? stage_name ?? ...` and always joins to `profiles` when it can.

So the fix is:

1. **Backfill** `profiles.display_name` from the best available value (role names, auth, email).
2. **Enforce** that `display_name` is never NULL (default + NOT NULL).
3. **Keep using** `profiles.display_name` everywhere in the app (already done).

---

## 4) What Supabase should do (exact steps)

Tell Supabase to run the migration we use as the single source of truth:

**“Run the migration file `supabase/migrations/20260219_display_name_source_of_truth.sql`.”**

That migration:

1. Ensures `profiles` has `display_name`, `full_name`, `username`.
2. Backfills `profiles.display_name` in this order (only where it’s still NULL or blank):
   - From **artists** (stage_name, then name)
   - From **engineers** (stage_name, then name)
   - From **producers** (stage_name, then name)
   - From **stoodioz** (stage_name, then name)
   - From **labels** (stage_name, then name)
   - From **profiles.full_name**, then **profiles.name** (if the column exists)
   - From **auth.users.raw_user_meta_data->>'name'**
   - Fallback: **email local part** (before `@`)
3. Sets any remaining NULL/blank to `'New user'`.
4. Sets `display_name` to `NOT NULL` with default `'New user'`.

After that, every profile has a non-NULL `display_name`, and the app will show that everywhere it uses `getDisplayName` or the directory/fetch responses.

---

## 5) Optional: fix missing `profile_id` on role rows

If a user (e.g. vijeta) has **profile_id = NULL** on their artist/engineer/producer row, the app may not join them to `profiles`, so we never see `profiles.display_name`. In that case Supabase should also:

- Find role rows where `profile_id` is NULL but we can match the user (e.g. by email in `profiles` or by `auth.users.id`).
- Set `role.profile_id = profiles.id` for that user.

Example (adapt table/column names to your schema):

```sql
-- Example: backfill artist.profile_id from profiles by email (if you have email on artists)
-- UPDATE public.artists a SET profile_id = p.id
-- FROM public.profiles p
-- WHERE a.profile_id IS NULL AND p.email = a.email AND p.email IS NOT NULL;
```

If Supabase confirms that vijeta’s **profile** row has a valid `id` and the **artist** row has `profile_id = NULL`, then a one-off backfill of `artists.profile_id` (and the same for engineers/producers/stoodioz/labels) from the matching profile will fix the link so the app can show `profiles.display_name` for them.

---

## 6) Summary

- **NULL** = no value stored; use `IS NULL` / `IS NOT NULL` in SQL.
- **Single source of truth for “name” in the app** = `public.profiles.display_name`.
- **What Supabase should do:** Run **`supabase/migrations/20260219_display_name_source_of_truth.sql`** so all users have a non-NULL display name and the app always shows the name they chose (or the best available backfill). Optionally backfill `profile_id` on role tables so every role row points to the correct profile.
