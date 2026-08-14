-- Vision AI — initial schema for Supabase.
-- Run this in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
--
-- Covers:
--   * devices     — known devices (announced by the realtime presence hook)
--   * conversations — one chat thread per device
--   * messages    — user/assistant turns, with optional target_device_id
--                   (null = "this device", otherwise the reply is routed there)
--   * Realtime publication (messages + devices) so replies can be pushed to a
--     target device's browser without polling.
--   * RLS policies. This scaffold has no auth, so policies are wide open for
--     the publishable key. Tighten them once you add real users.

-- pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------------

create table if not exists public.devices (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  kind         text not null default 'browser'
               check (kind in ('browser', 'display', 'mobile', 'tablet', 'tv')),
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid references public.devices (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations (id) on delete cascade,
  role              text not null check (role in ('user', 'assistant', 'system')),
  content           text not null,
  target_device_id  uuid references public.devices (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

create index if not exists devices_last_seen_idx
  on public.devices (last_seen_at desc);

-- --------------------------------------------------------------------------
-- updated_at bump on conversations when a message is added
-- --------------------------------------------------------------------------

create or replace function public.touch_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation();

-- --------------------------------------------------------------------------
-- Realtime
-- --------------------------------------------------------------------------

-- Push new/updated rows to connected browsers:
--   * messages — the routed reply arrives on the target device instantly
--   * devices  — name/kind/metadata sync alongside the presence channel
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.devices;
exception
  when duplicate_object then null;
end;
$$;

-- --------------------------------------------------------------------------
-- Row Level Security (wide open — no auth wired in yet)
-- --------------------------------------------------------------------------

alter table public.devices        enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;

create policy "devices: select all"
  on public.devices for select using (true);

create policy "devices: insert all"
  on public.devices for insert with check (true);

create policy "devices: update all"
  on public.devices for update using (true);

create policy "conversations: select all"
  on public.conversations for select using (true);

create policy "conversations: insert all"
  on public.conversations for insert with check (true);

create policy "conversations: update all"
  on public.conversations for update using (true);

create policy "messages: select all"
  on public.messages for select using (true);

create policy "messages: insert all"
  on public.messages for insert with check (true);

create policy "messages: update all"
  on public.messages for update using (true);
