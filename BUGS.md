# Stoodioz – Bug & Risk Report

**Purpose:** Single list of known bugs, deployment gaps, and code risks that could cause buggy behavior later. No guesswork—each item is something that can fail or already has.

---

## 🔴 Critical (can break flows or data)

| # | What | Where / Why | Fix |
|---|------|-------------|-----|
| 1 | **Role table updates blocked** | Engineers, Artists, Producers, Labels had RLS with only SELECT. Toggling “Available for Hire”, saving profile photos to role row, etc. could fail. | Run migration `supabase/migrations/20260211_role_tables_update_policies.sql` in Supabase. |
| 2 | **Stripe webhook** | Already implemented in code (booking, wallet, tip, masterclass, subscription). | Deploy the edge function; no code change. |
| 3 | **Edge functions not deployed** | CORS / 404 when calling fetch-recording-studios, invite-studio, stripe checkout functions. | Deploy all edge functions (see APP_DIAGNOSTIC_REPORT.md). |
| 4 | **`unregistered_studios` table missing** | 404 if migration not run. | Run `supabase/migrations/20260129_unregistered_studios.sql`. |


---

## 🟡 High (silent or confusing failures)

| # | What | Where / Why | Fix |
|---|------|-------------|-----|
| 5 | **refreshCurrentUser fails silently** | `hooks/useProfile.ts`: catch only logs to console; user state can stay stale after profile/photo update. | Consider showing a subtle “Couldn’t refresh profile” or retry; or keep log and add background logger in dev. |
| 6 | **verificationSubmit fails silently** | Same file: catch only logs; user gets no feedback if verification submit fails. | Add user-visible error (e.g. alert or toast) on failure. |
| 7 | **safeSelect returns fallback on error** | `apiService.ts`: many reads use `safeSelect` and return empty/fallback. User sees empty data with no indication of failure. | Optional: surface “Couldn’t load” in critical views (e.g. dashboard, profile) when key data is missing. |
| 8 | **Next.js API routes vs Vite** | `pages/api/stripe/*.ts` exist but app is Vite. Those routes only work if a Next server is running. | Use Supabase edge functions for Stripe (or remove Next routes and document). |
| 9 | **Booking success URL handling** | Was: session booking success went to dashboard. | **Fixed:** Navigate to MY_BOOKINGS when `stripe=success` and `booking_id` present (`App.tsx`). |

---

## 🟢 Medium (edge cases / polish)

| # | What | Where / Why | Fix |
|---|------|-------------|-----|
| 10 | **Google Maps referer error** | Map can show RefererNotAllowedMapError if key restrictions don’t include dev origins. | Add `http://127.0.0.1:5173` (and 5174 if used) to Google Cloud API key restrictions. |
| 11 | **Promises without .catch()** | Several `.then(...)` calls (e.g. TheStage, ArtistProfile, ProducerProfile, RoomManager, LabelNotifications, ClaimConfirmScreen) have no `.catch()`. Failures can be unhandled. | Add `.catch(() => {})` or proper error handling so errors don’t break the app. |
| 12 | **video.play() / AudioContext.resume()** | StageMediaFrame, MixDoctor: `.catch(() => {})` swallows autoplay/context errors. User may see silent failure. | Optional: show “Tap to play” or small message when autoplay fails. |

---

## ✅ Already addressed in code

- **After logout and login, no followers / same users suggested to follow again:** On login we only set profile + role; we never loaded follow data. So `currentUser.following` and `currentUser.followers` were undefined, the UI showed 0 followers and didn’t know who the user already follows, and “Who to follow” looked like everyone could be followed again. **Fixed:** `fetchCurrentUserProfile` now calls `computeFollowData(supabase, uid)` and merges `followers`, `follower_ids`, and `following` into the user before returning, so after login the app has the correct follow state. `refreshCurrentUser` in useProfile now preserves `followers`, `follower_ids`, and `following` when merging so a profile refresh doesn’t wipe them.
- **Producer Dashboard Beat Store showed 0 beats while Producer Profile showed beats:** The dashboard uses `currentUser` (set at login), which does not load `instrumentals`. The public Producer Profile uses `fetchFullProducer`, which does load instrumentals. So the dashboard’s BeatManager was reading `producer.instrumentals || []` and got an empty list. **Fixed:** BeatManager now fetches its own instrumentals on mount (and after save/delete) via `fetchInstrumentalsForProducer(profile_id)`, so the dashboard list matches the profile. Saves use `profile_id` for `producer_id` so rows stay keyed correctly.
- **Artist profile disconnect (e.g. Vijeta):** After directory refresh or `UPDATE_USERS`, the selected artist was re-resolved only by `id` and the user map was keyed only by `id`, so the selection could be lost when `id` vs `profile_id` differed. Fixed: AppContext keys the user map by both `id` and `profile_id` and resolves selected artist/engineer/producer/stoodio/label by either; ArtistProfile finds existing artist by `id` or `profile_id`.
- Map user types/icons: fixed to use explicit role.
- Profile photos: profiles updated first; `profile_id` set on login; role RLS fix (#1) lets role row updates succeed.
- Settings save errors: LabelSettings, ProducerSettings, StoodioDashboard show success/error alerts.
- Error boundaries: App and root have error boundaries so a crash doesn’t white-screen without recovery.

---

## Summary

- **Critical:** 4 items — fix by **running SQL** (#1, #4) and **deploying** (#2, #3). No other app code touched.
- **High:** 5 items — #5, #6, #9 fixed in code; #7, #8 left as-is.
- **Medium:** 3 items — #11 fixed in code; #10 is config; #12 optional.

**What you still do (no code):** Run the two migrations in Supabase, deploy edge functions, add Maps referer in Google Cloud if needed.

---

## Background logger (no user-visible change)

A small logger lives in `utils/backgroundLogger.ts`. It **only runs when `import.meta.env.DEV` is true** (development). In production it does nothing. It is used in a few critical catch blocks (e.g. refresh user profile, verification submit, create post) so that in dev, failures are sent to the debug ingest and to `console.debug`. No UI, no toggles, no visible change for users.
