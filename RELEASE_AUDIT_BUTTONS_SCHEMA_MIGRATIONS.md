# Release audit: buttons, schema & migrations

**Scope:** Every button/action → API → table/column, and every migration → table/column.  
**Goal:** Confirm app and DB are in sync for release.  
**No code changes were made; this is report-only.**

---

## 1. Tables the app uses (from apiService)

| Table (apiService) | Migration that creates table | Notes |
|--------------------|------------------------------|--------|
| **profiles** | **NONE in repo** | Assumed from Supabase Auth / dashboard. Migrations only ALTER (image_url, wallet_balance, etc.). |
| **posts** | **NONE in repo** | Assumed to exist. 20260202/20260205 only alter author_id FK. |
| **follows** | **NONE in repo** | Assumed to exist. 20260202 only alters FKs. |
| **post_likes** | 20260208 | CREATE TABLE IF NOT EXISTS. |
| **post_comments** | 20260208 | CREATE TABLE IF NOT EXISTS. |
| **conversations** | **NONE in repo** | Assumed to exist. 20260201 adds columns (room_id, conversation_type, title, image_url). |
| **messages** | **NONE in repo** | Assumed to exist. 20260201 adds columns (type, image_url, audio_url, etc.). |
| **live_rooms** | 20260201 | CREATE TABLE. |
| **live_room_participants** | 20260201 | CREATE TABLE. |
| **bookings** | **NONE in repo** | Assumed to exist. 20260128/20260207 add columns (beat_purchase_type, product_purchase, engineer_profile_id). |
| **rooms** | 20260122 | CREATE TABLE IF NOT EXISTS. |
| **room_photos** | 20260123_create_missing_tables | CREATE TABLE IF NOT EXISTS. |
| **engineers** | 20260208 | CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN. |
| **artists** | 20260208 | CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN. |
| **producers** | 20260208 | CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN. |
| **stoodioz** | 20260208 | CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN. |
| **labels** | 20260208 | CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN. |
| **instrumentals** | 20260124 | CREATE TABLE IF NOT EXISTS. 20260128 adds columns. 20260205 alters producer_id FK. |
| **producer_products** | 20260128_instrumentals_lease_tiers | CREATE TABLE IF NOT EXISTS. |
| **mixing_samples** | 20260130 | CREATE TABLE IF NOT EXISTS (also ref’d by 20260202 for engineer_id). |
| **mixing_sample_ratings** | 20260130 | CREATE TABLE. |
| **assets** | 20260123_create_missing_tables | CREATE TABLE IF NOT EXISTS. |
| **documents** | 20260204 | CREATE TABLE. |
| **label_roster** | **NONE in repo** | Assumed to exist. 20260126/20260123_add_notifications/20260207 only ALTER. |
| **label_projects** | 20260123_create_missing_tables | CREATE TABLE IF NOT EXISTS. |
| **label_project_tasks** | 20260123_create_missing_tables | CREATE TABLE IF NOT EXISTS. |
| **label_transactions** | 20260123_create_missing_tables | CREATE TABLE. 20260123_add_label_budgets/20260207/20260208 add columns (artist_id, booking_id). |
| **label_budgets** | 20260123_add_label_budgets | CREATE TABLE. |
| **label_booking_approvals** | 20260207 | CREATE TABLE (TABLES.labelApprovals). |
| **label_contracts** | 20260123_add_label_contracts | CREATE TABLE. |
| **label_notifications** | 20260123_add_notifications_and_allocations | CREATE TABLE. |
| **label_payout_requests** | 20260123_add_label_payout_requests | CREATE TABLE. |
| **unregistered_studios** | 20260129 | (Referenced; verify migration creates it.) |
| **reviews** | 20260123_add_reviews | CREATE TABLE. |
| **stripe_events** | 20260203 | CREATE TABLE. |
| **app_reviews** | 20260206 | CREATE TABLE. |
| **label_scouting_notes** | 20260123_add_scouting_tables | CREATE TABLE. |
| **label_scouting_shortlist** | 20260123_add_scouting_tables | CREATE TABLE. |
| **payments** | 20260123_create_missing_tables | CREATE TABLE IF NOT EXISTS. |

---

## 2. Views used by app but not in migrations folder

- **artists_v, engineers_v, producers_v, stoodioz_v, labels_v**  
  - Used in `getAllPublicUsers()` (apiService).  
  - Defined in **SUPABASE_PROFILE_CANONICAL_VIEWS.sql** (project root), **not** in `supabase/migrations/`.  
  - If that file has never been run in Supabase, the app falls back to base tables (artists, engineers, producers, stoodioz, labels).  
  - **Gap:** Views are optional but recommended; they are not part of migration history. Consider moving view creation into a migration (e.g. after 20260208) so they are always applied.

---

## 3. Column vs migration alignment (critical for 400s)

### 3.1 Producers table – source of your 400

- **getAllPublicUsers (fallback to base table)** uses:  
  `id, name, image_url, cover_image_url, genres, instrumentals, rating_overall, ranking_tier, profile_id`  
  - If **instrumentals** (or any of these) is missing on `producers`, the request returns **400**.
- **fetchFullRoleRow('producers')** uses a **narrow** select:  
  `id, name, image_url, cover_image_url, profile_id, genres, rating_overall, ranking_tier`  
  - No `instrumentals` in this path; still requires the columns listed.
- **Migration 20260208** adds to `producers`: image_url, cover_image_url, bio, email, wallet_balance, rating_overall, sessions_completed, ranking_tier, genres, **instrumentals**, profile_id, created_at, updated_at, links, isAdmin, subscription, is_on_streak, on_time_rate, completion_rate, repeat_hire_rate, strength_tags, local_rank_text, purchased_masterclass_ids.

**Conclusion:** The 400 on the landing page happens when the **producers** table does not yet have all columns the app selects (e.g. migration 20260208 not run, or only partly run). **Action:** Run `20260208_add_missing_role_columns.sql` on the project that serves `ijcxeispefnbfwiviyux.supabase.co`.

**Your 400 URL decoded:** The failing request was to `producers?select=id,name,image_url,cover_image_url,bio,email,wallet_balance,rating_overall,sessions_completed,ranking_tier,genres,instrumentals,profile_id,created_at,updated_at,links,isAdmin,subscription,is_on_streak,on_time_rate,completion_rate,repeat_hire_rate,strength_tags,local_rank_text,purchased_masterclass_ids` with `id=eq....` or `profile_id=eq....`. That full select is used in **fetchFullRoleRow** only for engineers/artists/stoodioz/labels in the current code; producers use the narrow select. So either (1) an older build is still using the full list for producers, or (2) the failure is from **getAllPublicUsers** fallback when it queries base table `producers` with `selectProducers` (which includes `instrumentals`). In both cases, running 20260208 so `producers` has every column fixes the 400.

### 3.2 Other role tables (artists, engineers, stoodioz, labels)

- **getAllPublicUsers** selects:  
  - artists: id, name, stage_name, image_url, cover_image_url, genres, rating_overall, ranking_tier, profile_id  
  - engineers: id, name, image_url, cover_image_url, specialties, rating_overall, ranking_tier, profile_id  
  - stoodioz: id, name, image_url, cover_image_url, genres, amenities, rating_overall, ranking_tier, profile_id  
  - labels: id, name, image_url, cover_image_url, rating_overall, ranking_tier, profile_id  
- **20260208** adds these (and more) to each role table. If 20260208 is applied, these selects are covered.

### 3.3 Profiles

- App selects: id, username, full_name, display_name, email, role, image_url, avatar_url, cover_image_url, bio, location_text, coordinates, show_on_map, wallet_balance, etc.  
- Migrations 20260125, 20260203, 20260126 add image_url, cover_image_url, avatar_url, wallet_balance, wallet_transactions, stripe_customer_id, subscription_status, current_period_end, label_verified, verified_by_label_id.  
- **profiles** table itself is not created in repo; it is assumed to exist (Supabase Auth).

### 3.4 label_roster

- App uses: label_profile_id, artist_profile_id, allocation_amount, remaining_amount, claim_token, claim_code, dropped_at, etc.  
- 20260126, 20260123_add_notifications_and_allocations, 20260207 add these columns.  
- **label_roster** table is never created in migrations; assumed to exist.

---

## 4. Button → handler → API → table (sample; all paths follow same pattern)

| User action | Component / flow | API / hook | Table(s) / columns |
|-------------|-------------------|------------|---------------------|
| Back | All profile/detail pages | goBack() | (none) |
| Follow / Unfollow | Profile pages, cards | useSocial.toggleFollow → apiService.toggleFollow | **follows** (follower_id, following_id) |
| Message | Profile pages | useMessaging.startConversation → apiService | **conversations**, **messages** |
| Like post | PostFeed | useSocial.likePost → apiService.likePost | **post_likes** (post_id, profile_id) |
| Comment on post | PostFeed | useSocial.commentOnPost → apiService.commentOnPost | **post_comments** |
| Book (stoodio) | StoodioDetail, BookingModal | useBookings.openBookingModal / onBook → apiService.createBooking | **bookings** |
| Book engineer | EngineerProfile | initiateBookingWithEngineer → createBooking | **bookings** |
| Book pull up (producer) | ProducerProfile | initiateBookingWithProducer → createBooking | **bookings** |
| Purchase beat | ProducerProfile, InstrumentalPlayer | apiService.purchaseBeat | **bookings** (beat_purchase_type, product_purchase), Stripe |
| Purchase kit/preset | ProducerProfile | handlePurchaseKit → apiService.purchaseProduct | **bookings** (product_purchase), Stripe |
| Request mix | EngineerProfile | onOpenMixingModal → (booking/message flow) | **bookings** or messaging |
| Reviews | Profile pages | openReviewPage → apiService.submitReview | **reviews** |
| Create post | Dashboards / feed | apiService.createPost | **posts** |
| Delete post | PostFeed | apiService.deletePost | **posts** |
| Update profile / photo | useProfile.updateProfile | apiService.updateProfile + role table update | **profiles**, **artists** / **engineers** / **producers** / **stoodioz** / **labels** |
| Complete setup (new user) | App.tsx completeSetup | apiService.createUser | **profiles**, role table insert (**artists** / **engineers** / **producers** / **stoodioz** / **labels**) |
| Label: approve booking | LabelApprovals | apiService.approveLabelBooking | **bookings**, **label_booking_approvals**, **label_roster**, **label_transactions**, **label_notifications** |
| Label: deny booking | LabelApprovals | apiService.denyLabelBooking | **bookings**, **label_booking_approvals**, **label_notifications** |
| Label: roster / allocations | LabelDashboard | apiService (labelRoster, labelBudgets, labelTransactions) | **label_roster**, **label_budgets**, **label_transactions** |
| Join live room | LiveHub | apiService.joinLiveRoom | **live_room_participants**, **live_rooms**, **conversations** |
| Create live room | LiveHub | apiService.createLiveRoom | **live_rooms**, **conversations** |
| Rate mixing sample | EngineerProfile / mixing sample UI | apiService (mixing sample ratings) | **mixing_sample_ratings** |
| Upload room photo | StoodioDashboard | apiService.uploadRoomPhoto | **room_photos**, storage |
| Upload asset / document | Dashboards | apiService.uploadAsset / uploadDocument | **assets**, **documents**, storage |
| Save instrumental | ProducerDashboard | apiService.upsertInstrumental | **instrumentals** |
| Save producer product | ProducerDashboard | apiService.upsertProducerProduct | **producer_products** |
| Update in_house_engineers | StoodioDashboard | apiService.updateInHouseEngineers | **stoodioz** (in_house_engineers) |
| Claim profile / roster | ClaimProfile, ClaimLabelProfile | apiService.claimByToken / claimRosterByToken | **profiles**, **label_roster** |

Every path above assumes the referenced table (and, where applicable, columns) exists. If a table is only altered in migrations and never created in repo, it must exist from Supabase/dashboard/setup.

---

## 5. Tables assumed to exist (not created in migrations)

These are **required** for the app but have **no CREATE TABLE in this repo**:

- **profiles** (Supabase Auth usually creates this)
- **posts**
- **follows**
- **bookings**
- **conversations**
- **messages**
- **label_roster**

**Risk:** A completely fresh project that only runs repo migrations will be missing these tables and will error on any button or load that touches them. For release, either:

- Document that these must be created (e.g. via Supabase dashboard or a one-time setup script), or  
- Add migrations (or one “base schema” migration) that create them with IF NOT EXISTS and minimal columns, then let existing migrations add the rest.

---

## 6. Unregistered studios

- apiService references **TABLES.unregisteredStudios** → `unregistered_studios`.  
- Migration **20260129_unregistered_studios.sql** should create or alter it; not re-verified column-by-column here.  
- **Action:** Confirm 20260129 creates `unregistered_studios` with the columns the app expects.

---

## 7. Posts table – columns

- App uses: author_id, label_profile_id (for label-scoped posts), and standard post fields.  
- 20260202/20260205 set author_id → profiles(id).  
- **posts** is never created in repo; assumed to exist. If your setup creates **posts**, ensure it has **author_id**, **label_profile_id** (if used), and any columns insert/update use.

---

## 8. Summary: what must be true for release

1. **Run 20260208** on the Supabase project that serves your app so **producers** (and other role tables) have every column the app selects (fixes landing-page 400).
2. **Views:** Either run **SUPABASE_PROFILE_CANONICAL_VIEWS.sql** on that project once, or move its content into a migration so views are always created.
3. **Base tables:** Ensure **profiles, posts, follows, bookings, conversations, messages, label_roster** exist in that project (created by Auth, dashboard, or a setup script). Repo migrations only alter or extend them.
4. **Migration order:** Run all migrations in timestamp order (20260122 → … → 20260208). No migration should be skipped if the app uses that table/column.
5. **Buttons:** Every button/flow above goes through apiService (or hook that calls it) and hits the tables listed. No extra “orphan” tables are assumed; the main risk is missing tables/columns, not extra ones.

---

## 9. Checklist before release

- [ ] 20260208_add_missing_role_columns.sql has been run on production (or the Supabase project you use for release).
- [ ] SUPABASE_PROFILE_CANONICAL_VIEWS.sql has been run once, or view creation is in a migration.
- [ ] Base tables (profiles, posts, follows, bookings, conversations, messages, label_roster) exist and have the columns the app uses.
- [ ] All other migrations in `supabase/migrations/` have been applied in order.
- [ ] Landing page loads without 400 (producers and other directory queries succeed).
- [ ] Follow, Message, Book, Purchase, Review, and Label approval flows were smoke-tested against the same DB.

---

*End of audit. No code or migration files were modified; fixes require your approval.*
