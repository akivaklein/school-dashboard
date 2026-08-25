begin;

-- Standalone Token Store security hardening
-- Goal: prevent anonymous/public data exposure while allowing authenticated
-- staff/register usage through existing role checks.

alter table if exists public.students enable row level security;
alter table if exists public.store_items enable row level security;
alter table if exists public.store_redemptions enable row level security;
alter table if exists public.points_events enable row level security;

-- Remove known legacy broad anon policies if present.
drop policy if exists students_select_portal on public.students;
drop policy if exists students_insert_portal on public.students;
drop policy if exists students_update_portal on public.students;
drop policy if exists students_delete_portal on public.students;

drop policy if exists points_events_select_portal on public.points_events;
drop policy if exists points_events_insert_portal on public.points_events;
drop policy if exists points_events_delete_portal on public.points_events;

-- Ensure anonymous role has no direct table access.
revoke all on table public.students from anon;
revoke all on table public.store_items from anon;
revoke all on table public.store_redemptions from anon;
revoke all on table public.points_events from anon;

-- Keep authenticated access role-based via dashboard_current_role().
-- These policies are additive and scoped to register/admin for standalone store usage.

drop policy if exists students_select_register_store on public.students;
create policy students_select_register_store
on public.students
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'register'));

drop policy if exists store_items_select_register_store on public.store_items;
create policy store_items_select_register_store
on public.store_items
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'register'));

drop policy if exists store_redemptions_select_register_store on public.store_redemptions;
create policy store_redemptions_select_register_store
on public.store_redemptions
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'register'));

drop policy if exists points_events_select_register_store on public.points_events;
create policy points_events_select_register_store
on public.points_events
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'register'));

drop policy if exists points_events_insert_register_store on public.points_events;
create policy points_events_insert_register_store
on public.points_events
for insert
to authenticated
with check (public.dashboard_current_role() in ('admin', 'register'));

drop policy if exists store_redemptions_insert_register_store on public.store_redemptions;
create policy store_redemptions_insert_register_store
on public.store_redemptions
for insert
to authenticated
with check (public.dashboard_current_role() in ('admin', 'register'));

commit;
