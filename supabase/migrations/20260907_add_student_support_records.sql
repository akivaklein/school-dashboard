begin;

alter table public.student_notes
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.todos
  add column if not exists student_id bigint references public.students(id) on delete set null,
  add column if not exists priority text not null default 'normal';

create table if not exists public.student_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  student_id bigint references public.students(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  target text not null,
  status text not null default 'active',
  created_by text not null,
  assigned_to text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists student_goals_student_id_created_at_idx
  on public.student_goals (student_id, created_at desc);

alter table public.student_goals enable row level security;

grant select, insert, update, delete on table public.student_goals to anon, authenticated;

drop policy if exists student_goals_select_portal on public.student_goals;
create policy student_goals_select_portal
on public.student_goals
for select
to anon, authenticated
using (true);

drop policy if exists student_goals_insert_portal on public.student_goals;
create policy student_goals_insert_portal
on public.student_goals
for insert
to anon, authenticated
with check (true);

drop policy if exists student_goals_update_portal on public.student_goals;
create policy student_goals_update_portal
on public.student_goals
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists student_goals_delete_portal on public.student_goals;
create policy student_goals_delete_portal
on public.student_goals
for delete
to anon, authenticated
using (true);

commit;