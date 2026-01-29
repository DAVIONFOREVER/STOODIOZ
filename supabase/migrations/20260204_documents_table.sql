-- ============================================
-- Documents table for AI/Vault uploads
-- Safe to run multiple times
-- ============================================

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  storage_path text,
  name text,
  type text,
  category text,
  size text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists documents_profile_id_idx on public.documents (profile_id);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
  on public.documents for select
  using (auth.uid() = profile_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents for insert
  with check (auth.uid() = profile_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
  on public.documents for delete
  using (auth.uid() = profile_id);

-- ============================================
-- DONE
-- ============================================
