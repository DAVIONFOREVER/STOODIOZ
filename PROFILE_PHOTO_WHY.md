# Why Aria's Photo Works and "davion forever" (Producer) Doesn't

## The Short Answer

- **Aria Cantata** uses a **static file** bundled with the app — never the database or Supabase Storage.
- **davion forever** (Producer) relies on **Supabase Storage + profiles table**, and the **Producer Dashboard did not call `updateProfile`** after upload, unlike the Engineer Dashboard.

---

## 1. Why Aria's Page Always Works

Aria is handled specially in `getProfileImageUrl`:

```ts
if (email === 'aria@stoodioz.ai' || nameLower.includes('aria cantata') || ...) {
  return ARIA_IMG;  // '/aria/0F91FD16-F2C6-4F90-8B50-925A73EF5BB3.PNG'
}
```

- That path points to a file in `public/aria/` — a static asset served by the app.
- It does not use the database, Supabase Storage, or uploads.
- It never expires or changes, so Aria's photo always displays.

---

## 2. Why Vijeta's Page Works

We don't have Vijeta-specific logic. If it works, it's because:

- Their `image_url` / `avatar_url` is correctly stored in `profiles` (or the role table).
- The Engineer/Artist/Stoodio Dashboard for Vijeta calls `updateProfile` after upload, so both `profiles` and the role table stay in sync.

---

## 3. Why davion forever (Producer) Photo Disappeared

### Data flow for Producer

1. **Upload**
   - `uploadAvatar` uploads to Supabase Storage and calls `updateUser(profileId, { image_url, avatar_url })` → writes to **profiles**.
   - **Producer Dashboard does NOT call `updateProfile`** → does not write to the **producers** table.

2. **Read**
   - Profile page: `fetchFullProducer` loads `producers` + `profiles` and merges `image_url` from `profiles`.
   - Landing page: `getAllPublicUsers` reads `producers_v` (producers.image_url), then enriches with `profiles.image_url`.

### Why it breaks

- If `profiles.image_url` is missing or wrong, both profile and landing page lose the photo.
- If `producers.image_url` is never set (Producer Dashboard skips `updateProfile`), we rely entirely on the `profiles` enrich. Any failure there (e.g. wrong `profile_id`, timeout) means no photo.

### What likely happened

- The photo used to show when both sources were consistent.
- A later change (profile overwrite, migration, or failed enrich) removed the URL from one of those sources, and Producer never had a fallback in the role table because the dashboard never called `updateProfile`.

---

## 4. The Fix

- **Producer Dashboard** should call `updateProfile({ image_url: url })` and `updateProfile({ cover_image_url: url })` after uploads, same as Engineer Dashboard.
- That writes to both `profiles` and `producers`, giving two places for the photo to come from and reducing the chance it disappears.
