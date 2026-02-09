-- Unsend: sender can hide a message from their own view only. Receiver keeps the message (already received).
-- When unsent_by_sender_at is set, the message is excluded from the sender's conversation view; receiver still sees it.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS unsent_by_sender_at timestamptz;
