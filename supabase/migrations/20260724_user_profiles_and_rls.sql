-- Deferred migration for Day 4 roles/permissions.
-- Safe to keep in repo without executing until you are ready to enforce access.

begin;

do $$
begin
  create type public.user_role as enum ('admin', 'teacher', 'therapist', 'office');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.user_profiles enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select up.role
  from public.user_profiles up
  where up.user_id = auth.uid()
    and up.active is true
  limit 1
$$;

alter table public.students enable row level security;
alter table public.points_events enable row level security;
alter table public.support_sessions enable row level security;
alter table public.student_notes enable row level security;

drop policy if exists user_profiles_select_own_or_admin on public.user_profiles;
create policy user_profiles_select_own_or_admin
on public.user_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists user_profiles_insert_admin on public.user_profiles;
create policy user_profiles_insert_admin
on public.user_profiles
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists user_profiles_update_admin on public.user_profiles;
create policy user_profiles_update_admin
on public.user_profiles
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists user_profiles_delete_admin on public.user_profiles;
create policy user_profiles_delete_admin
on public.user_profiles
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists students_select_authenticated on public.students;
create policy students_select_authenticated
on public.students
for select
to authenticated
using (true);

drop policy if exists students_insert_admin on public.students;
create policy students_insert_admin
on public.students
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists students_update_staff on public.students;
create policy students_update_staff
on public.students
for update
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
)
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists students_delete_admin on public.students;
create policy students_delete_admin
on public.students
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

drop policy if exists points_events_select_authenticated on public.points_events;
create policy points_events_select_authenticated
on public.points_events
for select
to authenticated
using (true);

drop policy if exists points_events_insert_staff on public.points_events;
create policy points_events_insert_staff
on public.points_events
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists points_events_delete_staff on public.points_events;
create policy points_events_delete_staff
on public.points_events
for delete
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists support_sessions_select_authenticated on public.support_sessions;
create policy support_sessions_select_authenticated
on public.support_sessions
for select
to authenticated
using (true);

drop policy if exists support_sessions_insert_staff on public.support_sessions;
create policy support_sessions_insert_staff
on public.support_sessions
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists support_sessions_update_staff on public.support_sessions;
create policy support_sessions_update_staff
on public.support_sessions
for update
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
)
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists support_sessions_delete_staff on public.support_sessions;
create policy support_sessions_delete_staff
on public.support_sessions
for delete
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists student_notes_select_authenticated on public.student_notes;
create policy student_notes_select_authenticated
on public.student_notes
for select
to authenticated
using (true);

drop policy if exists student_notes_insert_staff on public.student_notes;
create policy student_notes_insert_staff
on public.student_notes
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

drop policy if exists student_notes_delete_admin on public.student_notes;
create policy student_notes_delete_admin
on public.student_notes
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

commit;
