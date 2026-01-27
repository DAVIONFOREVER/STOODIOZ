create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  stoodio_id uuid,
  engineer_id uuid,
  producer_id uuid,
  artist_id uuid,
  masterclass_id uuid,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_name text not null,
  rating numeric not null,
  comment text,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists reviews_stoodio_id_idx on public.reviews (stoodio_id);
create index if not exists reviews_engineer_id_idx on public.reviews (engineer_id);
create index if not exists reviews_producer_id_idx on public.reviews (producer_id);
create index if not exists reviews_artist_id_idx on public.reviews (artist_id);
create index if not exists reviews_masterclass_id_idx on public.reviews (masterclass_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select" on public.reviews;
drop policy if exists "reviews_insert" on public.reviews;

create policy "reviews_select"
  on public.reviews for select
  using (true);

create policy "reviews_insert"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);
