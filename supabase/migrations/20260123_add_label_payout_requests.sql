create table if not exists public.label_payout_requests (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  artist_id uuid references public.profiles(id) on delete set null,
  artist_name text,
  amount numeric not null,
  status text default 'Pending',
  requested_on timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists label_payout_requests_label_id_idx
  on public.label_payout_requests (label_id);

alter table public.label_payout_requests enable row level security;

drop policy if exists "label_payout_requests_select" on public.label_payout_requests;
drop policy if exists "label_payout_requests_write" on public.label_payout_requests;

create policy "label_payout_requests_select"
  on public.label_payout_requests for select
  using (auth.uid() = label_id);

create policy "label_payout_requests_write"
  on public.label_payout_requests for all
  using (auth.uid() = label_id)
  with check (auth.uid() = label_id);
