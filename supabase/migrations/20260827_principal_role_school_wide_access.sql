begin;

-- Principal is a leadership role with the same school-wide access as admin.

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

-- Without an ORDER BY the previous definition returned an arbitrary row when a
-- user had more than one active role, so a role change could appear to be ignored.
create or replace function public.dashboard_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.is_active is true
  order by
    case ur.role
      when 'admin' then 0
      when 'principal' then 1
      when 'teacher' then 2
      when 'rebbe' then 3
      when 'support_staff' then 4
      else 5
    end,
    ur.role
  limit 1
$$;

-- Every existing admin-gated policy is intentionally widened to principal.
create or replace function public.dashboard_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.dashboard_current_role() in ('admin', 'principal'), false)
$$;

create or replace function public.dashboard_is_leadership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.dashboard_current_role() in ('admin', 'principal'), false)
$$;

drop policy if exists students_select_register on public.students;
create policy students_select_register
on public.students
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

drop policy if exists students_select_register_store on public.students;
create policy students_select_register_store
on public.students
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'principal', 'register'));

drop policy if exists store_items_select_register on public.store_items;
create policy store_items_select_register
on public.store_items
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

drop policy if exists store_redemptions_select_register on public.store_redemptions;
create policy store_redemptions_select_register
on public.store_redemptions
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

drop policy if exists points_events_select_register on public.points_events;
create policy points_events_select_register
on public.points_events
for select
to authenticated
using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

drop policy if exists points_events_insert_staff on public.points_events;
create policy points_events_insert_staff
on public.points_events
for insert
to authenticated
with check (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

drop policy if exists store_redemptions_insert_staff on public.store_redemptions;
create policy store_redemptions_insert_staff
on public.store_redemptions
for insert
to authenticated
with check (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff', 'register'));

-- Grades live in students.test_scores and public.grade_entries; leadership needs full read/write on both.
drop policy if exists students_update_leadership on public.students;
create policy students_update_leadership
on public.students
for update
to authenticated
using (public.dashboard_is_leadership())
with check (public.dashboard_is_leadership());

do $$
begin
  if to_regclass('public.grade_entries') is not null then
    execute 'alter table public.grade_entries enable row level security';

    execute 'drop policy if exists grade_entries_select_staff on public.grade_entries';
    execute $p$
      create policy grade_entries_select_staff
      on public.grade_entries
      for select
      to authenticated
      using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff'))
    $p$;

    execute 'drop policy if exists grade_entries_write_staff on public.grade_entries';
    execute $p$
      create policy grade_entries_write_staff
      on public.grade_entries
      for insert
      to authenticated
      with check (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff'))
    $p$;

    execute 'drop policy if exists grade_entries_update_staff on public.grade_entries';
    execute $p$
      create policy grade_entries_update_staff
      on public.grade_entries
      for update
      to authenticated
      using (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff'))
      with check (public.dashboard_current_role() in ('admin', 'principal', 'teacher', 'rebbe', 'support_staff'))
    $p$;
  end if;
end $$;

commit;
