# Stoodioz – Current Bug Count & Status

**Last updated:** 2025-02-01 (session)

---

## Summary

| Category              | Count | Notes                          |
|-----------------------|-------|--------------------------------|
| **Fixed this session** | 1     | Engineer (and all roles) RLS   |
| **Known open**        | 0     | After applying migration below |
| **Needs verification** | 0     | After repro + logs              |

---

## Fix applied (Engineer profile)

**Issue:** Engineer profile could not:
- Toggle **Available for Hire** or **Show on Map**
- Update profile/cover photos (role-table sync failed)
- Persist any `updateProfile` changes that touch the `engineers` table

**Root cause:** Role tables (`engineers`, `artists`, `producers`, `labels`) had RLS enabled with only a **SELECT** policy (`allow_public_read_directory`). **UPDATE** and **INSERT** were denied, so `useProfile` updates to the role row failed.

**Fix:** Migration `supabase/migrations/20260211_role_tables_update_policies.sql` adds:
- `*_update_own`: authenticated user can UPDATE their row where `profile_id = auth.uid()`
- `*_insert_own`: authenticated user can INSERT a row with `profile_id = auth.uid()`

for **engineers**, **artists**, **producers**, and **labels**. (Stoodioz already had equivalent policies.)

**What you need to do:** Run this migration in your Supabase project (SQL Editor or `supabase db push` / migration runner). After that, Engineer (and other role) dashboard toggles and profile photo updates should persist.

---

## Other areas (no open bugs counted)

- **Map:** User types/icons fixed in a previous session (role-based labels/icons).
- **Profile photos (all roles):** Persistence improved (profiles updated first; `profile_id` set on login).
- **Posts:** Create path uses `profile_id`; posts table RLS was not changed in this session (if post create ever fails, check posts RLS next).

---

## Bug count for “App Store readiness”

- **Current open bugs (after migration):** **0** for the Engineer profile behaviors above.
- **Recommended before store:** Run full regression (login as each role: Artist, Engineer, Producer, Stoodio, Label), test profile edit, photo upload, post create, and availability/map toggles; fix any remaining issues and update this doc.
