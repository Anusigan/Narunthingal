-- Run once in the Supabase SQL editor on the existing database.

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

drop policy if exists "Users insert own vote" on public.votes;
create policy "Users insert own vote"
  on public.votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.voting_events e
      where e.id = event_id and e.is_active
    )
  );

drop policy if exists "Authenticated read all votes" on public.votes;
drop policy if exists "Admins read all votes" on public.votes;
create policy "Admins read all votes"
  on public.votes for select
  using (public.is_admin());

drop policy if exists "Authenticated manage admins" on public.admins;
drop policy if exists "Admins manage admins" on public.admins;
create policy "Admins manage admins"
  on public.admins for all
  using (public.is_admin())
  with check (public.is_admin());
