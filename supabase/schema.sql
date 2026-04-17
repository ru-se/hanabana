-- Hanabin: memories table
-- Note: This MVP uses device_id as user_id until auth is added.

create table if not exists public.memories (
  id uuid primary key,
  user_id uuid not null,
  text text not null,
  mood text not null,
  xp float8 not null,
  created_at timestamptz not null default now(),
  week_key text not null
);

create index if not exists memories_user_id_created_at_idx
  on public.memories (user_id, created_at);

create index if not exists memories_user_id_week_key_idx
  on public.memories (user_id, week_key);

-- Optional: minimal RLS (off by default).
-- Enable only after you decide the auth strategy.
-- alter table public.memories enable row level security;
