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

-- Only admins can create/update/delete events
create policy "Admins manage voting events"
  on public.voting_events for all
  using (public.is_admin())
  with check (public.is_admin());


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

-- Helpers (plpgsql so they can reference tables defined later in this file)
create or replace function public.is_admin()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
end;
$$;

-- Which users have voted in an event (never who they voted for). Used by the
-- live board so ordinary users don't need read access to the votes table.
create or replace function public.voted_user_ids(p_event_id uuid)
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select user_id from public.votes where event_id = p_event_id;
$$;

-- Total votes cast in an event (for the post-vote results page).
create or replace function public.event_vote_count(p_event_id uuid)
returns bigint
language sql stable security definer set search_path = public
as $$
  select count(*) from public.votes where event_id = p_event_id;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.voted_user_ids(uuid) from public, anon;
revoke all on function public.event_vote_count(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.voted_user_ids(uuid) to authenticated;
grant execute on function public.event_vote_count(uuid) to authenticated;


-- Users can read their own votes
create policy "Users read own votes"
  on public.votes for select
  using (auth.uid() = user_id);

-- Users can insert their own vote, only while the event is open
create policy "Users insert own vote"
  on public.votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.voting_events e
      where e.id = event_id and e.is_active
    )
  );

-- Only admins can read every vote
create policy "Admins read all votes"
  on public.votes for select
  using (public.is_admin());


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

-- Only existing admins can add/remove admins
create policy "Admins manage admins"
  on public.admins for all
  using (public.is_admin())
  with check (public.is_admin());

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
