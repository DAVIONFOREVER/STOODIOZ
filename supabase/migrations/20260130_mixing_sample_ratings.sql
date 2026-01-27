-- Mixing sample ratings table
-- Allows authenticated users to rate mixing samples with stars (1-5)

-- First, ensure mixing_samples table exists
create table if not exists public.mixing_samples (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  engineer_id uuid references public.engineers(id) on delete cascade,
  title text not null,
  description text,
  audio_url text,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists mixing_samples_engineer_id_idx on public.mixing_samples (engineer_id);
create index if not exists mixing_samples_profile_id_idx on public.mixing_samples (profile_id);

alter table public.mixing_samples enable row level security;

create policy "Anyone can view mixing samples"
  on public.mixing_samples for select
  using (true);

create policy "Engineers can manage their own mixing samples"
  on public.mixing_samples for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Now create the ratings table
create table if not exists public.mixing_sample_ratings (
  id uuid primary key default gen_random_uuid(),
  mixing_sample_id uuid not null references public.mixing_samples(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(mixing_sample_id, rater_id) -- One rating per user per sample
);

create index if not exists mixing_sample_ratings_sample_id_idx 
  on public.mixing_sample_ratings (mixing_sample_id);

create index if not exists mixing_sample_ratings_rater_id_idx 
  on public.mixing_sample_ratings (rater_id);

-- RLS: Public can view ratings, authenticated users can rate
alter table public.mixing_sample_ratings enable row level security;

create policy "Anyone can view mixing sample ratings"
  on public.mixing_sample_ratings for select
  using (true);

create policy "Authenticated users can rate mixing samples"
  on public.mixing_sample_ratings for insert
  with check (auth.uid() = rater_id);

create policy "Users can update their own ratings"
  on public.mixing_sample_ratings for update
  using (auth.uid() = rater_id)
  with check (auth.uid() = rater_id);

-- Function to get average rating for a mixing sample
create or replace function public.get_mixing_sample_avg_rating(sample_id uuid)
returns numeric as $$
begin
  return (
    select coalesce(round(avg(rating)::numeric, 1), 0)
    from public.mixing_sample_ratings
    where mixing_sample_id = sample_id
  );
end;
$$ language plpgsql security definer;

-- Function to get rating count for a mixing sample
create or replace function public.get_mixing_sample_rating_count(sample_id uuid)
returns integer as $$
begin
  return (
    select count(*)
    from public.mixing_sample_ratings
    where mixing_sample_id = sample_id
  );
end;
$$ language plpgsql security definer;
