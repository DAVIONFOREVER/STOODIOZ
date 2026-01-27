-- Label notifications (persistent)
create table if not exists public.label_notifications (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  created_at timestamptz default now(),
  is_read boolean default false,
  priority text default 'normal',
  related_artist_name text,
  related_booking_id uuid,
  metadata jsonb default '{}'::jsonb
);

create index if not exists label_notifications_label_id_created_at_idx
  on public.label_notifications (label_id, created_at desc);

-- Label roster allocation support
alter table public.label_roster
  add column if not exists allocation_pct numeric;

-- Job board acceptance support
alter table public.bookings
  add column if not exists engineer_profile_id uuid;
