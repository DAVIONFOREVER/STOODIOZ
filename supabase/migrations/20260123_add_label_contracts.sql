create table if not exists public.label_contracts (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  talent_user_id uuid not null references public.profiles(id) on delete cascade,
  talent_role text,
  contract_type text default 'PERCENTAGE',
  split_percent numeric default 0,
  recoup_balance numeric default 0,
  advance_amount numeric,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists label_contracts_label_id_idx on public.label_contracts (label_id);
create index if not exists label_contracts_talent_user_id_idx on public.label_contracts (talent_user_id);

alter table public.label_contracts enable row level security;

drop policy if exists "label_contracts_select" on public.label_contracts;
drop policy if exists "label_contracts_write" on public.label_contracts;

create policy "label_contracts_select"
  on public.label_contracts for select
  using (auth.uid() = label_id);

create policy "label_contracts_write"
  on public.label_contracts for all
  using (auth.uid() = label_id)
  with check (auth.uid() = label_id);
