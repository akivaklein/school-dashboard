begin;

alter table public.student_tasks
  add column if not exists reminder_start_at timestamptz,
  add column if not exists snoozed_until timestamptz,
  add column if not exists notification_preference text not null default 'dashboard_only',
  add column if not exists recurrence_days smallint[] not null default '{}',
  add column if not exists series_id uuid,
  add column if not exists occurrence_number integer not null default 1;

alter table public.student_tasks
  drop constraint if exists student_tasks_repeat_type_check;

alter table public.student_tasks
  add constraint student_tasks_repeat_type_check
  check (repeat_type in ('one_time', 'daily_until_done', 'every_day', 'weekdays', 'specific_days'));

alter table public.student_tasks
  add constraint student_tasks_notification_preference_check
  check (notification_preference in ('dashboard_only', 'email', 'text', 'email_text'));

alter table public.student_tasks
  add constraint student_tasks_recurrence_days_check
  check (recurrence_days <@ array[0,1,2,3,4,5,6]::smallint[]);

create index if not exists student_tasks_reminder_start_idx
  on public.student_tasks (completed_at, reminder_start_at);
create index if not exists student_tasks_series_idx
  on public.student_tasks (series_id, due_at);

create table if not exists public.student_task_snoozes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.student_tasks(id) on delete cascade,
  snoozed_until timestamptz not null,
  snoozed_by text not null default 'Staff',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists student_task_snoozes_task_created_idx
  on public.student_task_snoozes (task_id, created_at desc);

alter table public.student_task_snoozes enable row level security;
revoke all on table public.student_task_snoozes from anon;
grant select, insert on table public.student_task_snoozes to authenticated;

drop policy if exists student_task_snoozes_select_staff on public.student_task_snoozes;
drop policy if exists student_task_snoozes_insert_staff on public.student_task_snoozes;

create policy student_task_snoozes_select_staff
on public.student_task_snoozes for select to authenticated
using (exists (select 1 from public.student_tasks task where task.id = student_task_snoozes.task_id));

create policy student_task_snoozes_insert_staff
on public.student_task_snoozes for insert to authenticated
with check (exists (select 1 from public.student_tasks task where task.id = student_task_snoozes.task_id));

commit;
