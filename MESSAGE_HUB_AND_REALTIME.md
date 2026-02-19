# Message Hub: persistence and notifications

## Persistence (conversations and messages)

- **Conversations** and **messages** are stored in Supabase (`conversations` and `messages` tables). They are **not** only in memory.
- When you open Message Hub (Inbox), the app calls `fetchConversations(profileId)` so your thread list and messages load from the server. After you log out and log back in, opening Message Hub again fetches and shows your conversations.
- **Participant IDs** must be **profiles.id** (the UUID from the `profiles` table), not the artist/engineer/stoodio row id. The app uses `(user as any)?.profile_id ?? user?.id` when creating conversations and sending messages so that the correct profile is used when available.

## Notifications when someone sends you a message

- The app subscribes to **Supabase Realtime** on the `messages` table. When a new row is inserted and the recipient is not the sender, the app refreshes the conversation list and adds an in-app notification (e.g. "X sent you a message").
- For this to work you must **enable Realtime** for the `messages` table:
  - Supabase Dashboard → **Database** → **Replication**
  - Add the `messages` table to the publication (e.g. `supabase_realtime`), or run:
    - `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
- If Realtime is not enabled, recipients will still see new messages when they open Message Hub (because we fetch conversations on open), but they will not get the instant in-app notification while the app is open.

## If conversations disappear or others don’t receive messages

1. **Conversations disappear after logout**  
   They are cleared from in-memory state on logout. When you log back in and open Message Hub, we fetch from the server. If the list is empty, check that `fetchConversations` is using the same `profile_id` (profiles.id) that was used when creating the conversation.

2. **Recipients don’t get messages or notifications**  
   - Confirm messages are inserted: Supabase Table Editor → `messages` table.  
   - Confirm Realtime is enabled for `messages` (see above).  
   - Confirm `participant_ids` on conversations are `profiles.id` values so both participants see the thread.
