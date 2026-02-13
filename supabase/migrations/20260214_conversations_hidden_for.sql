-- Allow users to "delete" (hide) a conversation thread for themselves only.
-- Other participants still see the thread.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS hidden_for_profile_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.conversations.hidden_for_profile_ids IS 'Profile IDs that have hidden this conversation from their inbox.';
