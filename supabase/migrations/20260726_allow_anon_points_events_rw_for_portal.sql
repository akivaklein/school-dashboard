-- Temporary policy fix for production portal points history writes.
-- The app currently uses custom in-app login (not Supabase Auth user_profiles),
-- so strict role-based RLS can block browser inserts/deletes to points_events.
--
-- IMPORTANT: Replace with least-privilege authenticated policies after
-- Supabase Auth integration is complete.

begin;

alter table public.points_events enable row level security;

-- Remove stricter policies if they exist.
drop policy if exists points_events_select_authenticated on public.points_events;
drop policy if exists points_events_insert_staff on public.points_events;
drop policy if exists points_events_delete_staff on public.points_events;

-- Open read/write needed by current portal architecture.
create policy points_events_select_portal
on public.points_events
for select
to anon, authenticated
using (true);

create policy points_events_insert_portal
on public.points_events
for insert
to anon, authenticated
with check (true);

create policy points_events_delete_portal
on public.points_events
for delete
to anon, authenticated
using (true);

commit;