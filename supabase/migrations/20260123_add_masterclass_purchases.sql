alter table public.profiles
  add column if not exists purchased_masterclass_ids text[] default '{}'::text[];
