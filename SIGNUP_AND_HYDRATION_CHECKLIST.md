# Signup & Hydration Checklist — All User Types

Use this to confirm signup and login work for **Artist**, **Engineer**, **Producer**, **Stoodio**, and **Label**.

---

## Prerequisites (one-time)

- [ ] **Supabase SQL ran**  
  In Supabase → SQL Editor, you ran the contents of `supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql` (profiles + role table policies).

- [ ] **Email confirmation off**  
  Supabase → Authentication → Providers → Email → **Confirm email** is **OFF** (so new users get a session right after signup).

- [ ] **Env set**  
  `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for your project.

- [ ] **Dev server**  
  `npm run dev` is running; app opens at `http://localhost:5174` (or the port shown in the terminal).

---

## Per-role signup test

For each row: sign up with a **new email**, complete the setup form, then confirm you land on the right dashboard.

| Role     | Step 1: Go to "Get Started" → choose role | Step 2: Fill form & submit | Step 3: You should land on |
|----------|------------------------------------------|----------------------------|----------------------------|
| **Artist**   | Landing → Get Started → **Artist**       | Name, username, bio, email, password (optional logo) | **The Stage** (artist feed) |
| **Engineer** | Landing → Get Started → **Engineer**     | Same as Artist             | **Engineer Dashboard**     |
| **Producer** | Landing → Get Started → **Producer**     | Same as Artist             | **Producer Dashboard**      |
| **Stoodio**  | Landing → Get Started → **Stoodio Owner** | Name, username, description, location, email, password | **Stoodio Dashboard**       |
| **Label**    | Landing → Get Started → **Label / Management** | Label name, username, contact email, password (optional logo) | **Label Dashboard**         |

- [ ] **Artist** — Sign up → lands on The Stage (artist view)
- [ ] **Engineer** — Sign up → lands on Engineer Dashboard
- [ ] **Producer** — Sign up → lands on Producer Dashboard
- [ ] **Stoodio** — Sign up → lands on Stoodio Dashboard
- [ ] **Label** — Sign up → lands on Label Dashboard

If any role fails: note the exact error (alert or console). Common causes: RLS policies not applied, or "Confirm email" still on.

---

## Login after signup (hydration)

For at least one account (e.g. the Label you just created):

- [ ] **Log out** (header or app logout).
- [ ] **Log in** with the same email/password.
- [ ] You land on the **correct dashboard** for that role (e.g. Label → Label Dashboard).
- [ ] **Resume session** (optional): refresh the page while logged in — you should stay logged in and on the same view (no redirect to Landing/Login).

---

## Quick reference: role → dashboard

| Role     | After login / signup |
|----------|----------------------|
| Artist   | The Stage            |
| Engineer | Engineer Dashboard   |
| Producer | Producer Dashboard   |
| Stoodio  | Stoodio Dashboard    |
| Label    | Label Dashboard      |

---

## If something fails

- **"Profile not found" / "could not load profile"**  
  Run the **profiles** part of `RUN_IN_SUPABASE_SQL_EDITOR.sql` (the two `allow_own_profile_*` policies). Turn off "Confirm email" if it’s on.

- **"Setup failed" / RLS or permission errors**  
  Run the **full** `RUN_IN_SUPABASE_SQL_EDITOR.sql` (profiles + all role tables). Ensure "Confirm email" is off.

- **Signup succeeds but I stay on the setup page**  
  App should navigate after signup; if not, check browser console for errors and that you’re on the latest code (including the `completeSetup` navigation fix).

- **Resume session doesn’t work / I get kicked to Login**  
  Same as "Profile not found": ensure `allow_own_profile_select` exists on `public.profiles` and "Confirm email" is off.

---

## File reference

- **SQL to run in Supabase:** `supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql`
- **Signup flow:** `App.tsx` → `completeSetup` → `apiService.createUser`; forms in `components/*Setup.tsx`
- **Login/hydration:** `hooks/useAuth.ts`, `apiService.fetchCurrentUserProfile`, `App.tsx` bootstrap
