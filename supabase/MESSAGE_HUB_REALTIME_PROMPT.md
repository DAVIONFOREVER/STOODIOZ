# Supabase prompt: Enable Message Hub Realtime & notifications

Copy and use this in Supabase (SQL Editor or support).

---

**Goal:** Enable instant message delivery and in-app notifications for the Message Hub. New messages should appear in real time for the recipient and trigger a notification without a page refresh.

**Should I do the RLS audit and indexes?**  
**Yes.** It won’t mess up your app. Your app already only loads conversations where the user is in `participant_ids`; these policies enforce the same rule in the database and are required for Realtime to deliver events only to participants. Use the migration in this repo (see below) or let Supabase add equivalent policies.

---

**Steps:**

1. **Add `messages` to Realtime (SQL)**  
   Run in the Supabase SQL Editor:

```sql
-- Enable Realtime for the messages table (instant delivery + in-app notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

2. **RLS + indexes (participant-based)**  
   Run the migration in this repo:

   **`supabase/migrations/20260216_messages_conversations_rls_realtime.sql`**

   It does the following (safe, matches app behavior):
   - **Conversations:** SELECT/INSERT/UPDATE only for participants; respects `hidden_for_profile_ids`.
   - **Messages:** SELECT only if the user is a participant in the conversation; INSERT only if sender and participant; UPDATE only for own message (e.g. unsend).
   - **Indexes:** `messages(conversation_id)`, `messages(created_at)`, and GIN on `conversations(participant_ids)` so Realtime and app queries stay fast.

   If you prefer Supabase to do it: accept their offer to “Audit current RLS policies on public.messages and add/adjust a participant-based SELECT policy” and “Add helpful indexes for policy filters”. The result should be equivalent to the migration above.

3. **Optional: confirm**  
   Dashboard → **Database** → **Replication** → `messages` in publication.  
   **Authentication** → **Policies** → check `messages` and `conversations` policies.

**Result:** When a message is inserted, only participants can SELECT it (RLS), so Realtime delivers the event only to them. The app already subscribes to `postgres_changes` on `messages`; with Realtime + RLS, delivery and notifications work as intended.
