-- Conversations and messages: ensure columns exist so live chat and DMs work.
-- Safe to run multiple times.

-- Conversations: id, participant_ids, created_at (required by createConversation and fetchConversations)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participant_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS room_id uuid,
  ADD COLUMN IF NOT EXISTS conversation_type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Messages: conversation_id, sender_id, text, type, created_at (required by sendMessage)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  text text DEFAULT '',
  type text DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS link jsonb,
  ADD COLUMN IF NOT EXISTS files jsonb,
  ADD COLUMN IF NOT EXISTS audio_info jsonb;
