# Fix: User signed up as Label but shows as Artist

If someone went through **Label** signup but the app shows them as **Artist**, their **profiles** row has `role = 'ARTIST'` (often because profile insert failed during signup and the fallback profile was created with the wrong role). You can fix them in the database and ensure they have a **labels** row.

---

## 1. Get their profile id

You need the **profiles.id** (same as their auth user id) for the person who should be a Label.

- **Option A:** In Supabase **Table Editor → profiles**, find them by **email** or **display_name** and copy their **id** (UUID).
- **Option B:** In Supabase **Authentication → Users**, find the user and copy their **User UID** (same as profiles.id).

---

## 2. Run this SQL in Supabase (SQL Editor)

Replace the two placeholders:

- **`THEIR_PROFILE_ID`** = the UUID from step 1 (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
- **`Label Name`** = the label name to show (e.g. their company name or display name). You can use their existing **display_name** from profiles if you prefer.

Replace **THEIR_PROFILE_ID** with their UUID (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) and **Label Name** with the name you want for the label (e.g. their company name).

```sql
UPDATE public.profiles
SET role = 'LABEL', updated_at = now()
WHERE id = 'THEIR_PROFILE_ID';

INSERT INTO public.labels (profile_id, name)
SELECT 'THEIR_PROFILE_ID'::uuid, 'Label Name'
WHERE NOT EXISTS (SELECT 1 FROM public.labels WHERE profile_id = 'THEIR_PROFILE_ID'::uuid);
```

(That way you don’t create a duplicate labels row if you run the fix more than once.)

---

## 3. Have them log in again

After the SQL runs:

- They should **log out** (or clear session).
- **Log in** again.

The app reads **profiles.role** and the **labels** row; they should now see the **Label dashboard** and be treated as a Label everywhere.

---

## Why this can happen

1. During Label signup, **createUser** is supposed to insert a **profiles** row with `role = 'LABEL'` and a **labels** row.
2. If the **profiles** insert fails (e.g. RLS, timeout, network), no profile exists.
3. On next load or login, **fetchCurrentUserProfile** sees no profile and creates a **fallback** profile. Previously that fallback always used `role = 'ARTIST'`, so they showed as Artist.
4. Code is now updated so the fallback **infers role** from existing role tables (e.g. if a **labels** row exists, use LABEL). For users already created as ARTIST, the SQL above fixes them manually.

---

## Preventing it for new signups

- Ensure **profiles** RLS allows insert for the new user (run the migrations in **RUN_IN_SUPABASE_SQL_EDITOR.sql**).
- Ensure **labels** RLS allows insert (run **20260211_role_tables_update_policies.sql** or the full **RUN_IN_SUPABASE_SQL_EDITOR.sql**).
- Turn off **Confirm email** in Supabase Auth so the new user has a session when createUser runs.
