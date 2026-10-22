-- Run once in the Supabase SQL editor (after migration_vote_security.sql,
-- which defines public.is_admin()).

drop policy if exists "Authenticated manage voting events" on public.voting_events;
drop policy if exists "Admins manage voting events" on public.voting_events;
create policy "Admins manage voting events"
  on public.voting_events for all
  using (public.is_admin())
  with check (public.is_admin());
