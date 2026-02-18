# Message Hub – Realtime & Notifications

For **instant message delivery** and **in-app notifications** when someone sends you a message:

1. **Enable Realtime for the `messages` table**
   - Supabase Dashboard → **Database** → **Replication**
   - Add `messages` to the publication (or run in SQL):
   - `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

2. **RLS**
   - Ensure your RLS policies on `messages` allow `SELECT` for participants so Realtime can broadcast inserts to the right clients.

Without this, new messages only appear after a refresh or when the recipient refetches; the bell notification for new messages also depends on Realtime.

## Mobile / in-app calling

- Video calls use WebRTC (`getUserMedia`, `RTCPeerConnection`). They require **HTTPS** (or localhost) and **camera/mic permission**.
- On mobile, the browser may prompt for permission when you start or accept a call; grant it for the hub to work.
