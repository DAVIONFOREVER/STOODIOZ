# Single Source of Truth — Expert Analysis & Master-Level Fix Proposal

**Date:** February 1, 2025  
**Purpose:** Full audit of user/role data architecture. No edits until you approve.

---

## Permanent Rules (Profile / Posts / Photos) — DO NOT BREAK

1. **Identity:** `profile_id` (profiles.id) is the canonical id for posts (`author_id`), follows, and display. Role tables have `profile_id`; after load, merged user objects use `id = profile_id` and `profile_id = profile_id` so one id works everywhere.

2. **Display name:** Always use `getDisplayName(entity)`. Name comes from **profiles**: `display_name` then `username` then (for artists) `stage_name` then `full_name`. Directory and `fetchFullArtist` / `refreshCurrentUser` merge profile `display_name` and `username`; directory enrichment also sets `name` from profile so lists show the same name as profile/Stage.

3. **Profile photos:** **Profiles table is the single source.** `updateProfile` writes image to profiles first, then role table. When loading users (directory, fetchFullArtist, fetchFullRoleRow, refreshCurrentUser), always merge profile `image_url` / `avatar_url` first. Directory `enrichFromProfiles` overwrites every row’s `image_url` from profile when profile has one so desktop and mobile show the same photo. Always display via `getProfileImageUrl(user)`.

4. **Posts:** Create posts with `author_id = profile_id` (createPostWithAuthor uses `(currentUser as any).profile_id ?? currentUser.id`). Fetch posts by **profile_id first**: `fetchUserPosts(profileId, fallbackAuthorIds)` with optional fallback ids (e.g. role id) for legacy rows. Artist Profile and Artist Dashboard both call `fetchUserPosts((artist).profile_id ?? artist.id, fallbackIds)`. The Stage uses the same profile_id for temp posts, edit/delete checks, and manage-mode filter so feed, profile, and dashboard stay in sync.

5. **Stoodio rooms:** **rooms.stoodio_id** stores the studio’s **profile_id** (profiles.id) after unification. Load rooms only by profile_id: `fetchFullStoodio` queries `rooms` with `stoodio_id = profileId` first, then falls back to `stoodio_id = roleId` only for legacy DBs. RoomManager saves with `stoodio_id: (stoodio).profile_id ?? stoodio.id` and loads via `fetchFullStoodio(stoodioProfileId)` so dashboard and public profile use the same id. StoodioDetail passes `profile_id` first to `fetchFullStoodio` so the forward-facing profile gets the same rooms as the dashboard.

---

## Executive Summary

You chose **profiles.id (profile_id)** as the canonical identifier. Migrations `20260202_unify_profile_ids.sql` and `20260205_targeted_profile_backfills.sql` converted posts, follows, rooms, and instrumentals to use profile_id. The DB layer is largely unified.

The remaining issues are:
1. **In-memory directory state** — Landing page reads from AppContext only; when cleared (logout), it shows empty until boot rehydrates.
2. **Scattered ID handling** — Some code paths still try `role_id` or `stoodioz.id` when the DB now expects `profile_id`.
3. **No single directory fetch on demand** — If boot timing fails, there is no fallback when LandingPage mounts with empty lists.

---

## Part 1: Current Architecture Map

### 1.1 Database Schema (Post-Migration)

| Table | Canonical ID | FK Targets |
|-------|--------------|------------|
| `profiles` | `id` (profiles.id) | — |
| `artists` | `profile_id` → profiles.id | 1:1 with profiles |
| `engineers` | `profile_id` → profiles.id | 1:1 with profiles |
| `producers` | `profile_id` → profiles.id | 1:1 with profiles |
| `stoodioz` | `profile_id` → profiles.id | 1:1 with profiles |
| `labels` | `profile_id` → profiles.id | 1:1 with profiles |
| `posts` | `author_id` → profiles.id | ✅ unified |
| `follows` | `follower_id`, `following_id` → profiles.id | ✅ unified |
| `rooms` | `stoodio_id` → profiles.id | ✅ unified (was stoodioz.id) |
| `instrumentals` | `producer_id` → profiles.id | ✅ unified |
| `bookings` | Mixed: `stoodio_id`, `artist_profile_id`, `engineer_profile_id`, etc. | Various |

### 1.2 Views (Canonical for Directory)

- `artists_v`, `engineers_v`, `producers_v`, `stoodioz_v`, `labels_v`
- Each exposes `profile_id AS id` — so view rows have `id = profile_id`
- Used by `getAllPublicUsers` when available; falls back to base tables

### 1.3 Data Flow — Where Directory Comes From

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ App.tsx (mount)                                                              │
│   loadDirectory() → getAllPublicUsers() → SET_INITIAL_DATA                   │
│   (artists_v, engineers_v, ... OR artists, engineers, ... base tables)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ AppContext                                                                   │
│   state.artists, state.engineers, state.producers, state.stoodioz, state.labels
│   (in-memory; cleared on LOGOUT / RESET_APP)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐
│ LandingPage       │   │ StoodioList, ArtistList,  │   │ StoodioDetail,       │
│ uses state ONLY   │   │ EngineerList, ProducerList│   │ ArtistProfile, etc.  │
│ NO direct fetch   │   │ use state                 │   │ fetch from apiService│
└───────────────────┘   └───────────────────────────┘   └──────────────────────┘
```

---

## Part 2: Every Place That Reads/Writes User Data

### 2.1 Directory Source (Landing + Lists)

| File | Data Source | ID Used |
|------|-------------|---------|
| `LandingPage.tsx` | `useAppState()` → artists, engineers, producers, stoodioz, labels | `id` or `profile_id` (from state) |
| `StoodioList.tsx` | Same (state) | Same |
| `ArtistList.tsx` | Same (state) | Same |
| `EngineerList.tsx` | Same (state) | Same |
| `ProducerList.tsx` | Same (state) | Same |
| `App.tsx` | `loadDirectory()` → `getAllPublicUsers()` → `SET_INITIAL_DATA` | — |
| `LabelScouting.tsx` | `getAllPublicUsers()` direct call | — |

**Problem:** LandingPage never fetches. If state is empty (e.g. after logout, before rehydrate), it shows zero.

### 2.2 Profile Detail Pages (Full Fetch)

| File | Fetch Function | ID Passed | ID Expected |
|------|----------------|-----------|-------------|
| `StoodioDetail.tsx` | `fetchFullStoodio(targetId)` | `selectedStoodio?.profile_id` or `selectedStoodio?.id` | profile_id or role_id (both supported) |
| `ArtistProfile.tsx` | `fetchFullArtist(idOrUsername)` | From navigation / state | profile_id or role_id |
| `EngineerProfile.tsx` | `fetchFullEngineer(idOrUsername)` | Same | Same |
| `ProducerProfile.tsx` | `fetchFullProducer(idOrUsername)` | Same | Same |
| `LabelProfile.tsx` | Label-specific fetch | Same | Same |

**Note:** `fetchFullRoleRow` in apiService queries by both `profile_id` AND `id` (role table PK). It normalizes output to `out.id = out.profile_id ?? out.id`, so consumers get profile_id as id.

### 2.3 Posts

| File | Function | ID Used |
|------|----------|---------|
| `apiService.fetchUserPosts(profileId)` | `posts.eq('author_id', profileId)` | profile_id ✅ |
| `apiService.createPost(profileId, ...)` | `author_id: profileId` | profile_id ✅ |
| `StoodioDetail.tsx` loadPosts | `fetchUserPosts(stoodio.id)` + fallback `fetchUserPosts(role_id)` | stoodio.id = profile_id; fallback for legacy |

### 2.4 Follows

| File | Function | ID Used |
|------|----------|---------|
| `apiService.computeFollowData` | `follows.eq('following_id', profileId)` etc. | profile_id ✅ |
| `apiService` (followingByType) | Queries role tables `.in('profile_id', followingIds)` | profile_id ✅ |

### 2.5 Rooms

| File | Function | ID Used | Status |
|------|----------|---------|--------|
| `apiService.fetchFullStoodio` | `rooms.eq('stoodio_id', out.id)` then fallback `eq('stoodio_id', out.role_id)` | out.id = profile_id; fallback = role_id | Mixed: primary correct |
| `apiService.upsertRoom(room, stoodioId)` | `stoodio_id: stoodioId` | Passed from RoomManager | RoomManager passes `stoodio.id` = profile_id ✅ |
| `useProfile.refreshCurrentUser` | `rooms.eq('stoodio_id', stoodioRoleId)` | **stoodioRoleId = roleRow.id \|\| role_id \|\| currentUser.id** | ⚠️ BUG: uses stoodioz.id first; rooms.stoodio_id now expects profile_id |
| `hooks/useProfile.ts` L201 | `stoodio_id = stoodioRoleId` | stoodioz table id | ⚠️ Wrong after migration |

### 2.6 Bookings

| File | Function | ID Used |
|------|----------|---------|
| `apiService` (getBookingsForUser) | `bookings.eq('stoodio_id', profileId)` for STOODIO | profile_id ✅ |
| `utils/booking.ts` | `getStoodioBookings(bookings, stoodioId)` | Compares `booking.stoodio?.id` and `booking.stoodio_id` | Either works if bookings normalized |
| `StoodioInsights.tsx` | `stoodioId = currentUser.id` | profile_id; filters `b.stoodio_id === stoodioId \|\| b.stoodio?.id === stoodioId` | OK (covers both) |
| `MapView.tsx` | `b?.stoodio?.id \|\| b?.stoodio_id` | Either | OK |
| `StoodioDashboard.tsx` | `stoodio_id: stoodio.id` | stoodio.id = profile_id | OK |

### 2.7 Reviews

| File | Function | ID Used |
|------|----------|---------|
| `StoodioDetail.tsx` | `fetchReviewsForTarget(UserRole.STOODIO, stoodio.id)` + fallback role_id | Mixed |
| `apiService` (reviews) | Target by role + id | Depends on reviews table schema |

### 2.8 In-House Engineers / Stoodioz Table

| File | Function | ID Used |
|------|----------|---------|
| `apiService.upsertInHouseEngineer` | `stoodioz.eq('id', stoodioId)` | stoodioz.id (role table) — needed because in_house_engineers is JSONB on stoodioz |
| `apiService.getStoodiozIdByProfileId` | Returns stoodioz.id | For legacy paths that still need stoodioz row id |
| `apiService.ensureStoodiozForProfile` | Returns stoodioz.id | Same — but `upsertRoom` receives this and writes to rooms.stoodio_id |

**Critical:** After migration, `rooms.stoodio_id` FK → profiles.id. Passing stoodioz.id into rooms.stoodio_id would violate FK. RoomManager passes `stoodio.id` (profile_id) from currentUser, so that path is correct. The `ensureStoodiozForProfile` / `getStoodiozIdByProfileId` are used elsewhere — need to verify no room creation uses stoodioz.id for rooms.stoodio_id.

### 2.9 Instrumentals

| File | Function | ID Used |
|------|----------|---------|
| `apiService.fetchInstrumentalsForProducer(producerId)` | `instrumentals.eq('producer_id', producerId)` | producerId = profile_id ✅ |
| `apiService.fetchFullProducer` | Passes `profileId` (profile_id) to fetchInstrumentals | profile_id ✅ |

---

## Part 3: Known Bugs and Inconsistencies

### Bug 1: useProfile rooms query uses wrong ID

**File:** `hooks/useProfile.ts` lines 199–201

```ts
const stoodioRoleId = (resolvedRoleRow as any)?.id || (currentUser as any)?.role_id || currentUser.id;
const { data: r } = await client.from('rooms').select('*').eq('stoodio_id', stoodioRoleId).order('name');
```

**Problem:** After migration, `rooms.stoodio_id` = profile_id. `stoodioRoleId` prefers stoodioz.id (role table). Query returns empty.

**Fix:** Use `currentUser.id` (profile_id) for rooms:

```ts
const profileId = currentUser.id; // rooms.stoodio_id now FK to profiles.id
const { data: r } = await client.from('rooms').select('*').eq('stoodio_id', profileId).order('name');
```

### Bug 2: Landing page has no fallback when state is empty

**File:** `components/LandingPage.tsx`

**Problem:** Reads only from AppContext. After LOGOUT, state resets to empty. `loadDirectory()` runs again but is async. Landing can render with empty arrays before SET_INITIAL_DATA.

**Fix:** When LandingPage mounts and any directory array is empty, trigger a fetch and dispatch SET_INITIAL_DATA. Component-owned, not boot-dependent.

### Bug 3: StoodioDetail / ArtistProfile etc. still have role_id fallbacks

**Files:** `StoodioDetail.tsx`, others

**Status:** Fallbacks (e.g. fetchUserPosts by role_id if profile_id returns nothing) are defensive. If all data is migrated, they are unnecessary but harmless. Optional cleanup.

---

## Part 4: Master-Level Fix Proposal

### Phase A: Fix Critical Bugs (Required)

1. **useProfile.ts — rooms query**
   - Change rooms query to use `currentUser.id` (profile_id) instead of `stoodioRoleId` (stoodioz.id).
   - File: `hooks/useProfile.ts` ~L199–201.

2. **LandingPage.tsx — directory rehydration**
   - On mount, if `(artists?.length ?? 0) + (engineers?.length ?? 0) + ... === 0`, call `getAllPublicUsers(true)` and dispatch `SET_INITIAL_DATA` with result.
   - Ensures landing never stays empty due to boot timing.
   - File: `components/LandingPage.tsx`.

### Phase B: Single Directory Source (Recommended)

3. **Centralize directory access**
   - Add a `useDirectory()` hook that:
     - Returns `{ artists, engineers, producers, stoodioz, labels, isLoading, refresh }`.
     - Reads from AppContext.
     - Exposes `refresh()` that calls `getAllPublicUsers(true)` and dispatches SET_INITIAL_DATA.
   - LandingPage and list components use `useDirectory()` instead of raw `useAppState()`.
   - Ensures one place owns "when to fetch" and "what to read."

4. **Guarantee directory load on public views**
   - When navigating to LANDING_PAGE, STOODIO_LIST, ARTIST_LIST, etc., if directory is empty, trigger `refresh()` from the hook.
   - Implement in `useDirectory` or in a small effect in App.tsx when `currentView` is a directory view and arrays are empty.

### Phase C: Optional Hardening

5. **Remove role_id fallbacks** in StoodioDetail, ArtistProfile, etc., if you are certain all DB rows use profile_id. Low priority.

6. **Audit `ensureStoodiozForProfile` / `getStoodiozIdByProfileId`** — ensure they are never used to populate `rooms.stoodio_id`. Current RoomManager path uses profile_id; verify no other caller passes stoodioz.id into room creation.

---

## Part 5: Verification Checklist

Before considering this "permanently fixed":

- [ ] **DB migrations applied:** `20260202_unify_profile_ids.sql`, `20260205_targeted_profile_backfills.sql` have run.
- [ ] **Views exist:** `artists_v`, `engineers_v`, `producers_v`, `stoodioz_v`, `labels_v` exist and expose `profile_id AS id`.
- [ ] **useProfile rooms fix:** Rooms load correctly for STOODIO users after refresh.
- [ ] **Landing rehydration:** Logout → land on LANDING_PAGE → directory shows users (either from boot or from LandingPage fetch).
- [ ] **Profile pages:** Artist/Engineer/Producer/Stoodio/Label profiles load by profile_id.
- [ ] **Posts:** Created and fetched by profile_id.
- [ ] **Follows:** Work with profile_id.
- [ ] **Bookings:** Stoodio bookings filter by profile_id.
- [ ] **Rooms:** Created and queried by profile_id.

---

## Part 6: Summary Table — Who Uses What

| Consumer | Source | ID Convention |
|----------|--------|---------------|
| LandingPage | AppContext (state) | id = profile_id (from getAllPublicUsers) |
| List components | AppContext | Same |
| Profile detail pages | apiService fetch | id normalized to profile_id |
| Posts | apiService | author_id = profile_id ✅ |
| Follows | apiService | follower_id, following_id = profile_id ✅ |
| Rooms (query) | useProfile | ⚠️ Currently wrong (stoodioz.id) → fix to profile_id |
| Rooms (upsert) | RoomManager → upsertRoom | profile_id ✅ |
| Bookings | apiService, utils | Mixed; profile_id primary |
| Instrumentals | apiService | producer_id = profile_id ✅ |

---

## Part 7: PROOF — Your Complaints Mapped to Fixes

This section maps each of your complaints to the exact fix and proves why it resolves the issue.

### Complaint 1: "Landing page shows zero even though backend has users"

**Root cause:**  
- LandingPage reads from `useAppState()` → `artists`, `engineers`, etc.  
- Those arrays come from `SET_INITIAL_DATA`, which is dispatched when `loadDirectory()` in App.tsx finishes.  
- On logout, `LOGOUT` resets state to `initialState` → all arrays = `[]`.  
- `loadDirectory()` is called again, but it’s async.  
- LandingPage mounts and renders **before** `loadDirectory()` completes.  
- At that moment, `state.artists` etc. are still `[]`, so LandingPage shows zero.

**Fix:**  
LandingPage runs a `useEffect` on mount: if `artists + engineers + producers + stoodioz + labels` is empty, call `getAllPublicUsers(true)` and dispatch `SET_INITIAL_DATA` with the result.

**Why it fixes it:**
1. LandingPage mounts with empty state.
2. Effect sees empty → calls `getAllPublicUsers(true)`.
3. API returns users from Supabase (same source as before).
4. Dispatch `SET_INITIAL_DATA` updates state.
5. LandingPage re-renders with populated arrays.
6. Landing no longer depends on App boot timing; it rehydrates itself when empty.

**Proof chain:** Empty on mount → fetch triggered → state updated → UI shows users.  
Independent of when App.tsx `loadDirectory()` runs.

---

### Complaint 2: "Profile pages look correct but landing is empty — different data paths"

**Root cause:**  
- Profile pages (e.g. StoodioDetail) call `fetchFullStoodio(id)` → direct Supabase query → always fresh.  
- LandingPage only reads from in-memory state → if state is empty, it stays empty.  
- Different paths: profiles fetch on demand; landing never fetches.

**Fix:**  
LandingPage fetches when it mounts with empty lists.

**Why it fixes it:**
- Both paths still exist (profiles fetch directly; landing reads from state).
- The problem was not “two paths” but “landing has no path to get data when state is empty.”
- Now landing has a path: when empty, it triggers a fetch and updates state.
- Landing and profiles both end up with valid data; landing no longer stays empty while profiles work.

---

### Complaint 3: "role_id vs profile_id — one fix breaks the other"

**Root cause:**  
- Some DB columns were migrated to `profile_id` (e.g. `rooms.stoodio_id`, `posts.author_id`).  
- Some code still queried by `role_id` (e.g. stoodioz.id).  
- Fixing one path could break another if IDs were mixed.

**Fix 1 (Landing):**  
`getAllPublicUsers` already uses views that expose `profile_id AS id`. Its output is profile-centric. LandingPage just needs to trigger this when state is empty — no ID changes.

**Fix 2 (Rooms):**  
`useProfile` currently queries rooms with `stoodioRoleId` (stoodioz table id). After migration, `rooms.stoodio_id` = profile_id. Change the query to use `currentUser.id` (profile_id).

**Why it fixes it:**
- DB uses profile_id; query must use profile_id.
- One ID system in the DB, one in the query. No mixing.

---

### Complaint 4: "State gets cleared on logout and not rehydrated at the right time"

**Root cause:**  
- `LOGOUT` → `initialState` → all arrays `[]`.  
- `loadDirectory()` is called again in the auth listener.  
- Race: if user navigates to LANDING_PAGE before `loadDirectory()` finishes, state is still empty.

**Fix:**  
LandingPage fetches when it mounts with empty lists.

**Why it fixes it:**
- `loadDirectory()` can still run late or fail.
- LandingPage’s effect runs when the component mounts.
- If state is empty at that moment, it fetches and dispatches.
- Rehydration is no longer tied only to App boot; it happens when LandingPage is actually shown with empty data.

---

### Complaint 5: "No single source of truth — sloppy, unprofessional"

**Current state:**  
- DB: single source is profiles + role tables with profile_id. Migrations enforce this.  
- API: `getAllPublicUsers` reads from views (profile-centric) or base tables; output is normalized to profile_id.  
- App: directory lives in AppContext; one fetch (`getAllPublicUsers`), one dispatch (`SET_INITIAL_DATA`).

**Gap:**  
- When state is cleared or not yet loaded, there is no guaranteed rehydration for LandingPage.

**Fix:**  
LandingPage triggers a fetch when it mounts with empty lists.  
- Same API (`getAllPublicUsers`).  
- Same dispatch (`SET_INITIAL_DATA`).  
- Same state.  
- Extra trigger point when the UI needs data and state is empty.

**Result:**  
One API, one state shape, one source of truth. LandingPage ensures that source is populated when it’s shown with empty data.

---

### Proof: Test Procedure (Run After Implementing)

1. **Landing empty after logout**
   - Log in.
   - Log out.
   - You should land on LANDING_PAGE.
   - **Expected:** Featured users and counts appear (either from boot or from LandingPage fetch).
   - **Before fix:** Often showed zero.

2. **Rooms for STOODIO**
   - Log in as a Stoodio.
   - Go to dashboard → Manage Rooms.
   - **Expected:** Rooms load (or “no rooms yet” if none).
   - **Before fix:** Rooms could be empty even when they exist, due to wrong ID in query.

3. **Profile vs landing consistency**
   - As guest, open a profile (e.g. from list).
   - Go back to landing.
   - **Expected:** Both profile and landing show the same users.

---

## Conclusion

The DB is unified on profile_id. The main remaining issues are:

1. **useProfile** querying rooms by stoodioz.id instead of profile_id.
2. **LandingPage** having no fallback when in-memory state is empty.

Phase A fixes address both. Phase B adds a single directory abstraction. Phase C is optional hardening.

**No code has been changed.** This document is the proposal. Approve the phases you want, and implementation can proceed.
