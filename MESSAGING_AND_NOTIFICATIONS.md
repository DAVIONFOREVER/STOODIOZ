# Messaging & notifications (Vijeta / DM flow)

## When you send someone a message

1. **Message is saved** – `apiService.sendMessage()` inserts into the `messages` table (no notification row or push is created there).

2. **Recipient has the app open**
   - **Realtime:** Supabase realtime is subscribed to `public:messages` (in `hooks/useMessaging.ts`). On INSERT, if the message is from someone else (not the current user), the app refetches conversations and updates the Inbox.
   - **In-app notification:** After refetch, the app dispatches `ADD_NOTIFICATION` so the recipient gets:
     - A **toast** (e.g. “Vijeta sent you a message”) that auto-dismisses after 8 seconds.
     - An entry in the **bell** (NotificationPanel) with the same message; clicking it goes to Inbox and opens that conversation.

3. **Recipient does not have the app open**
   - No push, no email. They only see the message and any in-app notification after they open the app and load Inbox.

## Unsend (delete only for you)

- **Messages stay unless you remove them.** The app does not auto-delete messages.
- **You cannot delete a message for the receiver.** Once they have it, it stays on their side.
- **Unsend:** You can only “unsend” a message **for yourself**. That hides it from your view only; the receiver still sees it (it was already sent). In the thread, your messages show an “Unsend” link; clicking it marks the message as unsent on the server and refreshes your conversation so the message disappears for you. The other person’s view is unchanged.

## Summary

- **Message delivery:** Realtime + refetch when the app is open; otherwise they see it when they next open the app.
- **In-app notification (bell + toast):** Implemented; recipient sees “{sender name} sent you a message” and can go to Inbox from the notification.
- **Unsend:** Sender can unsend (hide on their side only); receiver keeps the message.
- **Push / email:** Not implemented; can be added later if needed.
