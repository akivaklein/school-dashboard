\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users values ('00000000-0000-0000-0000-000000000001');
create function auth.uid() returns uuid language sql stable as $$ select '00000000-0000-0000-0000-000000000001'::uuid $$;
create function public.dashboard_has_permission(section text, minimum text) returns boolean language sql stable as $$
  select coalesce(current_setting('test.denied', true), '') <> minimum
$$;
create function public.dashboard_is_admin() returns boolean language sql stable as $$ select true $$;
create table public.students(id bigint primary key, name text, is_active boolean default true);
create table public.student_class_assignments(student_id bigint primary key, class_id text);
create table public.davening_checklists(id integer primary key, title text);
insert into public.davening_checklists values (1, 'Existing legacy checklist');
insert into public.students values (1, 'QA Student One', true), (2, 'QA Student Two', true), (3, 'QA Archived', false);
insert into public.student_class_assignments values (1, 'yk-a'), (2, 'yk-b');