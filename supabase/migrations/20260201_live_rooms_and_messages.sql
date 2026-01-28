-- Live rooms + messaging extensions

create table if not exists public.live_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  title text not null,
  conversation_id uuid,
  cover_image_url text,
  is_live boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists live_rooms_is_live_idx on public.live_rooms (is_live, created_at);
create index if not exists live_rooms_host_id_idx on public.live_rooms (host_id);

create table if not exists public.live_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  profile_id uuid not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

create unique index if not exists live_room_participants_room_profile_idx
  on public.live_room_participants (room_id, profile_id);
create index if not exists live_room_participants_room_idx on public.live_room_participants (room_id);

alter table if exists public.conversations
  add column if not exists room_id uuid,
  add column if not exists conversation_type text,
  add column if not exists title text,
  add column if not exists image_url text;

alter table if exists public.messages
  add column if not exists type text,
  add column if not exists image_url text,
  add column if not exists audio_url text,
  add column if not exists video_url text,
  add column if not exists link jsonb,
  add column if not exists files jsonb,
  add column if not exists audio_info jsonb;

alter table public.live_rooms enable row level security;
alter table public.live_room_participants enable row level security;

create policy if not exists "live_rooms_select_all"
  on public.live_rooms
  for select
  to public
  using (true);

create policy if not exists "live_rooms_insert_host"
  on public.live_rooms
  for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy if not exists "live_rooms_update_host"
  on public.live_rooms
  for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy if not exists "live_rooms_delete_host"
  on public.live_rooms
  for delete
  to authenticated
  using (auth.uid() = host_id);

create policy if not exists "live_room_participants_select_all"
  on public.live_room_participants
  for select
  to public
  using (true);

create policy if not exists "live_room_participants_insert_self"
  on public.live_room_participants
  for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy if not exists "live_room_participants_update_self"
  on public.live_room_participants
  for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy if not exists "live_room_participants_delete_self"
  on public.live_room_participants
  for delete
  to authenticated
  using (auth.uid() = profile_id);
