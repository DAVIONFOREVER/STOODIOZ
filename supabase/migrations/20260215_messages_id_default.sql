-- Ensure messages.id has a default so INSERT without id works (avoids 400 from client-sent id being stripped by RLS/schema).
ALTER TABLE public.messages
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
