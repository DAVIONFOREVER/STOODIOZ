create table if not exists public.label_budgets (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  total_budget numeric default 0,
  amount_spent numeric default 0,
  currency text default 'usd',
  fiscal_year text,
  budget_mode text default 'MANUAL',
  monthly_allowance numeric,
  reset_day integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(label_id)
);

alter table public.label_transactions
  add column if not exists artist_id uuid references public.profiles(id);

alter table public.label_budgets enable row level security;

drop policy if exists "label_budgets_select" on public.label_budgets;
drop policy if exists "label_budgets_write" on public.label_budgets;

create policy "label_budgets_select"
  on public.label_budgets for select
  using (auth.uid() = label_id);

create policy "label_budgets_write"
  on public.label_budgets for all
  using (auth.uid() = label_id)
  with check (auth.uid() = label_id);
