create table if not exists public.app_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_name text not null,
  reviewer_avatar_url text,
  rating numeric not null,
  comment text,
  category text not null default 'app', -- 'app' or 'business'
  created_at timestamptz default now()
);

create index if not exists app_reviews_category_idx on public.app_reviews (category);
create index if not exists app_reviews_created_at_idx on public.app_reviews (created_at desc);

alter table public.app_reviews enable row level security;

drop policy if exists "app_reviews_select" on public.app_reviews;
drop policy if exists "app_reviews_insert" on public.app_reviews;

-- Anyone can read app reviews. Business reviews require login.
create policy "app_reviews_select"
  on public.app_reviews for select
  using (category = 'app' or auth.uid() is not null);

create policy "app_reviews_insert"
  on public.app_reviews for insert
  with check (auth.uid() = reviewer_id);
