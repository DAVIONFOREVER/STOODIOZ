create table if not exists public.label_scouting_notes (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  artist_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists label_scouting_notes_unique_idx
  on public.label_scouting_notes (label_id, artist_id);

create table if not exists public.label_scouting_shortlist (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  artist_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create unique index if not exists label_scouting_shortlist_unique_idx
  on public.label_scouting_shortlist (label_id, artist_id);

alter table public.label_scouting_notes enable row level security;
alter table public.label_scouting_shortlist enable row level security;

drop policy if exists "label_scouting_notes_select" on public.label_scouting_notes;
drop policy if exists "label_scouting_notes_write" on public.label_scouting_notes;
drop policy if exists "label_scouting_shortlist_select" on public.label_scouting_shortlist;
drop policy if exists "label_scouting_shortlist_write" on public.label_scouting_shortlist;

create policy "label_scouting_notes_select"
  on public.label_scouting_notes for select
  using (auth.uid() = label_id);

create policy "label_scouting_notes_write"
  on public.label_scouting_notes for all
  using (auth.uid() = label_id)
  with check (auth.uid() = label_id);

create policy "label_scouting_shortlist_select"
  on public.label_scouting_shortlist for select
  using (auth.uid() = label_id);

create policy "label_scouting_shortlist_write"
  on public.label_scouting_shortlist for all
  using (auth.uid() = label_id)
  with check (auth.uid() = label_id);
