-- Label approvals + allocation balances

-- Allocation amounts and remaining balances on roster
alter table public.label_roster
  add column if not exists allocation_amount numeric;

alter table public.label_roster
  add column if not exists remaining_amount numeric;

update public.label_roster
  set remaining_amount = allocation_amount
  where remaining_amount is null
    and allocation_amount is not null;

-- Label approval records per booking
create table if not exists public.label_booking_approvals (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  label_profile_id uuid not null references public.profiles(id) on delete cascade,
  artist_profile_id uuid references public.profiles(id),
  status text not null default 'PENDING',
  funding_source text,
  funding_amount numeric,
  approved_by_profile_id uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(booking_id)
);

create index if not exists label_booking_approvals_label_status_idx
  on public.label_booking_approvals (label_profile_id, status);

alter table public.label_booking_approvals enable row level security;

drop policy if exists "label_booking_approvals_select" on public.label_booking_approvals;
drop policy if exists "label_booking_approvals_write" on public.label_booking_approvals;

create policy "label_booking_approvals_select"
  on public.label_booking_approvals for select
  using (auth.uid() = label_profile_id);

create policy "label_booking_approvals_write"
  on public.label_booking_approvals for all
  using (auth.uid() = label_profile_id)
  with check (auth.uid() = label_profile_id);

-- Label transactions reference for bookings/artists
alter table public.label_transactions
  add column if not exists booking_id uuid references public.bookings(id);

alter table public.label_transactions
  add column if not exists artist_id uuid references public.profiles(id);
