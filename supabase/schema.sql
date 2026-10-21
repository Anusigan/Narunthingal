-- ============================================================
-- Narunthingal Portal — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. Profiles (mirrors auth.users)
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id    uuid references auth.users on delete cascade primary key,
  email text not null,
  name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read/update their own profile; auth callback can insert via service role
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow authenticated inserts (the callback upserts after OAuth)
create policy "Authenticated can insert profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ──────────────────────────────────────────────
-- 2. Applications
-- ──────────────────────────────────────────────
create table if not exists public.applications (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references public.profiles(id) on delete cascade not null,
  email                 text not null,
  name                  text not null,
  contact_number        text not null,
  first_preference      text not null,
  confidence_reason     text not null,
  second_preference     text,
  volunteered_last_year boolean not null default false,
  last_year_contribution text,
  current_clubs         text,
  previous_experience   text,
  submitted_at          timestamptz default now(),

  -- One application per user
  unique (user_id)
);

alter table public.applications enable row level security;

-- Users can read and insert their own application
create policy "Users read own application"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users insert own application"
  on public.applications for insert
  with check (auth.uid() = user_id);

-- Admins read all applications (we use the service role key from server for this)
-- The admin pages use the server client with anon key + RLS, so add a policy:
-- For simplicity, allow all authenticated @iit.ac.lk users to read all applications
-- (admin check is enforced in Next.js middleware, not at DB level)
create policy "Authenticated read all applications"
  on public.applications for select
  using (auth.role() = 'authenticated');


-- ──────────────────────────────────────────────
-- 3. Voting Events
-- ──────────────────────────────────────────────
create table if not exists public.voting_events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  candidates  jsonb not null default '[]'::jsonb,
  is_active   boolean default false,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

alter table public.voting_events enable row level security;

-- All authenticated users can read events
create policy "Authenticated read voting events"
  on public.voting_events for select
  using (auth.role() = 'authenticated');

-- All authenticated users can insert/update/delete (admin guard is in Next.js)
create policy "Authenticated manage voting events"
  on public.voting_events for all
  using (auth.role() = 'authenticated');


-- ──────────────────────────────────────────────
-- 4. Votes
-- ──────────────────────────────────────────────
create table if not exists public.votes (
  id         uuid default gen_random_uuid() primary key,
  event_id   uuid references public.voting_events(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  candidate  text not null,
  voted_at   timestamptz default now(),

  -- One vote per user per event
  unique (event_id, user_id)
);

alter table public.votes enable row level security;

-- Users can read their own votes
create policy "Users read own votes"
  on public.votes for select
  using (auth.uid() = user_id);

-- Users can insert their own vote
create policy "Users insert own vote"
  on public.votes for insert
  with check (auth.uid() = user_id);

-- Admins read all votes (Next.js guard ensures only admins reach the page)
create policy "Authenticated read all votes"
  on public.votes for select
  using (auth.role() = 'authenticated');


-- ──────────────────────────────────────────────
-- 5. Admins
-- ──────────────────────────────────────────────
create table if not exists public.admins (
  id        uuid default gen_random_uuid() primary key,
  email     text not null unique,
  added_by  text,
  added_at  timestamptz default now()
);

alter table public.admins enable row level security;

-- Any authenticated user can read admins (needed for the isAdminAsync check)
create policy "Authenticated read admins"
  on public.admins for select
  using (auth.role() = 'authenticated');

-- Only existing admins can insert/delete (enforced in Next.js server actions)
create policy "Authenticated manage admins"
  on public.admins for all
  using (auth.role() = 'authenticated');

-- Seed the initial admin
insert into public.admins (email, added_by)
values ('sivananthan.20230297@iit.ac.lk', 'system')
on conflict (email) do nothing;


-- ──────────────────────────────────────────────
-- 6. Auto-create profile on new user sign-up
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger first to allow re-running this script
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
