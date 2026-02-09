-- Fix "record new has no field read_by" when inserting messages (e.g. trigger expects this column).
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}';
