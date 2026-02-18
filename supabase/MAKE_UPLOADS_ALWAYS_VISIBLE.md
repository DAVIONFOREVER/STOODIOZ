# Make uploads always visible (rooms + beats)

Your app is built so that:

- **Rooms** are loaded by `stoodio_id` = **profile id** (and optionally stoodioz.id). RLS expects `stoodio_id = auth.uid()` (profile id).
- **Beats (instrumentals)** are loaded by `producer_id` = **profile id**. RLS expects `producer_id = auth.uid()` (profile id).

If a row is inserted with the wrong owner id (e.g. `stoodio_id` = stoodioz row id instead of profile id, or `producer_id` = producers row id instead of profile id), it can disappear from the forward-facing profile or break manage permissions.

Do these in order.

---

## Step 1: Tell Supabase to add “owner default” triggers (recommended)

This makes the database set the owner on insert when the client forgets, so uploads don’t disappear because of a missing/wrong id.

Say to Supabase:

**“Run this in the SQL Editor:**

1. **Instrumentals – default producer to current user on insert**

```sql
CREATE OR REPLACE FUNCTION public.instrumentals_owner_default()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.producer_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.producer_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_instrumentals_owner_default ON public.instrumentals;
CREATE TRIGGER trg_instrumentals_owner_default
BEFORE INSERT ON public.instrumentals
FOR EACH ROW EXECUTE FUNCTION public.instrumentals_owner_default();
```

2. **Rooms – default stoodio to current user on insert**

```sql
CREATE OR REPLACE FUNCTION public.rooms_owner_default()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stoodio_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.stoodio_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rooms_owner_default ON public.rooms;
CREATE TRIGGER trg_rooms_owner_default
BEFORE INSERT ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.rooms_owner_default();
```
**”**

Effect: New rows get the correct owner even if the app sends null or the wrong id.

---

## Step 2: (Optional) Lock owner on update so rows can’t be “orphaned”

Prevents an update from changing `producer_id`/`stoodio_id` to someone else or null, which would make the row disappear for you.

Say to Supabase:

**“Add BEFORE UPDATE triggers so producer_id and stoodio_id cannot be changed to a different user or null:**

- **Instrumentals:** If `producer_id` is being changed, reject unless it stays equal to `auth.uid()`.
- **Rooms:** If `stoodio_id` is being changed, reject unless it stays equal to `auth.uid()`.
- Do **not** add `ALTER COLUMN producer_id SET NOT NULL` / `stoodio_id SET NOT NULL` yet (we may have legacy rows with null); only add the trigger that rejects bad updates.
**”**

(They can use the “owner lock” trigger pattern from their earlier message, without the NOT NULL alter if you have existing nulls.)

---

## Step 3: App side – always send profile id as owner

The app already prefers profile id in the right places; we’ll make that strict so the “one second there, next second gone” case is not from a wrong id.

- **Rooms:** `RoomManager` already uses `stoodioId = (stoodio as any)?.profile_id ?? stoodio?.id` and passes it to `upsertRoom(..., stoodioId)`. So we always send profile_id when the stoodio object has it. No code change needed if your stoodio in context always has `profile_id` (it does when loaded from `fetchCurrentUserProfile` / dashboard).
- **Beats:** `BeatManager` uses `producer_id: profileId || producer.id`. We’ll change it to **always use profile id** when we have it, and ensure the producer object has `profile_id` so we never fall back to `producer.id` (role row id) for the owner column.

After Step 1 (and optionally Step 2), anything you upload will either always be visible (correct owner set by app or trigger) or fail with an error instead of silently disappearing.

---

## Why things “disappear” in your setup

- **RLS:** Rows are visible only if they match the policy. For rooms and instrumentals, “owner” is defined as `stoodio_id` / `producer_id` = **profile id** (auth.uid()).
- **Wrong id on insert:** If the app (or an old path) sends `stoodio_id` = stoodioz row id or `producer_id` = producers row id instead of profile id, the row might still be inserted but:
  - It may not show when we load by profile id (we do try both profile id and role id for rooms, but RLS and “who can manage” are by profile id).
  - Or a later update might overwrite the owner column if there’s no trigger to prevent it.
- **Trigger + app:** Step 1 (and optionally Step 2) plus Step 3 gives you: “whatever I upload should always be there” and no silent or random disappearing.
