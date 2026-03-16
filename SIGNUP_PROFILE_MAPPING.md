# Sign-up form → profile & role rows (single source of truth)

One place that defines how sign-up form fields map to the database. When you add a form field, update this and the code it points to.

---

## Flow (no guessing)

1. **Form** (e.g. `LabelSetup`, `ArtistSetup`) collects fields and calls `onCompleteSetup(data)` with one object.
2. **App** `completeSetup(data, role)` calls Supabase `signUp({ email, password })` then `createUser(data, role)`.
3. **createUser** (apiService):
   - Builds **one `profiles` row** from `data` (only keys in `PROFILES_SAFE_KEYS` are written).
   - Builds **one role row** (e.g. `labels`, `artists`) with `profile_id` + role-specific fields.

So: **same `data` object** goes from form → createUser; createUser maps it to `profiles` and to the role table.

---

## Form field → profile row (`public.profiles`)

Only these keys are written to `profiles` (see `PROFILES_SAFE_KEYS` in apiService.ts). Form fields must be passed under these names or mapped in createUser.

| Form / payload key | Profile column   | Notes                                      |
|--------------------|-------------------|--------------------------------------------|
| `name`             | `display_name`, `full_name` | Used for both if provided.                |
| `username`         | `username`        | Trimmed; empty not sent.                   |
| `email`            | `email`           |                                            |
| `bio` / `notes`    | `bio`             | LabelSetup sends `notes` as `bio`.        |
| `image_url`        | `image_url`       |                                            |
| `imageFile`        | —                 | Not stored as column; uploaded to storage, then URL in `image_url` / `avatar_url`. |
| `password`         | —                 | Auth only; never written to profiles.      |
| (set by createUser)| `id`              | Always auth user id.                       |
| (set by createUser)| `role`            | From `createUser(data, role)` e.g. LABEL.  |
| (set by createUser)| `created_at`, `updated_at` | Set by createUser.                  |

**Profile columns we write (PROFILES_SAFE_KEYS):**  
`id`, `display_name`, `full_name`, `username`, `email`, `bio`, `image_url`, `cover_image_url`, `avatar_url`, `created_at`, `updated_at`, `links`, `is_shadow`, `role`

To save a **new** form field into profiles: add the column to the DB, add that key to `PROFILES_SAFE_KEYS` in apiService.ts, and pass it from the form in the same object (or map it in createUser).

---

## Form field → role row (e.g. `labels`, `artists`)

createUser inserts **one row** into the role table for the chosen role. Currently:

| Role    | Table     | What createUser sends                          |
|---------|-----------|-------------------------------------------------|
| LABEL   | `labels`  | `profile_id`, `name` (from `payload.name` or display_name) |
| ARTIST  | `artists` | `profile_id`, `name`, optional `stage_name`    |
| ENGINEER| `engineers` | `profile_id`, `name`, optional `specialties` |
| PRODUCER| `producers` | `profile_id`, `name`                          |
| STOODIO | `stoodioz`  | `profile_id`, `name`                          |

Label form fields like `companyName`, `contactPhone`, `website` are **not** in the role payload yet. To save them: add the columns to `labels` (migration), then in createUser add e.g. `rolePayload.company_name = payload.companyName` (and same for contact_phone, website) for LABEL.

---

## Where to change what

| Goal                         | Where to change it |
|-----------------------------|--------------------|
| New **profile** column      | 1) Migration: add column to `profiles`. 2) apiService: add key to `PROFILES_SAFE_KEYS`. 3) Form: pass it in the object to `onCompleteSetup`. |
| New **role** column (e.g. label) | 1) Migration: add column to `labels`. 2) apiService createUser: set `rolePayload.column_name = payload.formFieldName` for that role. 3) Form: pass it in the object. |
| New form field → existing column | Form: include it in the object with the key createUser expects (see table above), or map in App when calling completeSetup. |

---

## Quick reference: LabelSetup → today

- **name** → profiles.display_name, full_name + labels.name  
- **username** → profiles.username  
- **email** → profiles.email (and auth)  
- **password** → auth only  
- **notes** → profiles.bio  
- **imageFile** → upload then profiles.image_url/avatar_url  
- **companyName, contactPhone, website** → not saved yet; add to labels + createUser if you want them.
