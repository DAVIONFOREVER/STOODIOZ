-- RLS for messages and conversations: only participants can read/write.
-- Required for Realtime: if a user can't SELECT a row, they won't receive its event.
-- Safe to run: matches how the app already works (fetchConversations filters by participant).

-- Conversations: participants can read; authenticated can insert (app creates via createConversation)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ANY(COALESCE(participant_ids, '{}'))
    AND (hidden_for_profile_ids IS NULL OR NOT (auth.uid() = ANY(hidden_for_profile_ids)))
  );

DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;
CREATE POLICY "conversations_insert_authenticated" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(COALESCE(participant_ids, '{}')));

DROP POLICY IF EXISTS "conversations_update_participants" ON public.conversations;
CREATE POLICY "conversations_update_participants" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(COALESCE(participant_ids, '{}')))
  WITH CHECK (auth.uid() = ANY(COALESCE(participant_ids, '{}')));

-- Messages: only conversation participants can read (Realtime uses this for delivery)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() = ANY(COALESCE(c.participant_ids, '{}'))
        AND (c.hidden_for_profile_ids IS NULL OR NOT (auth.uid() = ANY(c.hidden_for_profile_ids)))
    )
  );

DROP POLICY IF EXISTS "messages_insert_sender_participant" ON public.messages;
CREATE POLICY "messages_insert_sender_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() = ANY(COALESCE(c.participant_ids, '{}'))
    )
  );

-- Sender can update own message (e.g. unsent_by_sender_at)
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Indexes so the participant checks stay fast (Realtime and app queries)
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at);

-- Optional: GIN index so "auth.uid() = ANY(participant_ids)" can use it
CREATE INDEX IF NOT EXISTS conversations_participant_ids_gin_idx
  ON public.conversations USING GIN (participant_ids);
