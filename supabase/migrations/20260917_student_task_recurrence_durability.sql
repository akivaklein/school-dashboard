begin;

-- Skip = close only this occurrence without marking it Done, series continues.
alter table public.student_tasks
  add column if not exists skipped_at timestamptz,
  add column if not exists skipped_by text;

-- Cancel recurrence = stop future occurrences for the series; recorded on the
-- currently open occurrence (the "tip" of the series by occurrence_number).
alter table public.student_tasks
  add column if not exists recurrence_canceled_at timestamptz,
  add column if not exists recurrence_canceled_by text;

-- Prevent duplicate occurrences when both the client (on Done/Skip) and the
-- server-side catch-up job try to create the same next occurrence. A plain
-- (non-partial) unique constraint is required so upsert's ON CONFLICT target
-- can be inferred; Postgres already allows multiple NULL series_id rows.
alter table public.student_tasks
  drop constraint if exists student_tasks_series_occurrence_unique;
alter table public.student_tasks
  add constraint student_tasks_series_occurrence_unique unique (series_id, occurrence_number);

-- Latest occurrence per series, used by the server-side occurrence-advance job
-- to determine the next due date(s) without depending on anyone opening the app.
create or replace view public.student_task_series_tips as
select distinct on (series_id)
  id,
  student_id,
  title,
  note,
  due_at,
  reminder_start_at,
  repeat_type,
  recurrence_days,
  notification_preference,
  series_id,
  occurrence_number,
  recurrence_canceled_at,
  created_by
from public.student_tasks
where series_id is not null
  and repeat_type in ('every_day', 'weekdays', 'specific_days')
order by series_id, occurrence_number desc;

revoke all on public.student_task_series_tips from anon, authenticated;
grant select on public.student_task_series_tips to service_role;

commit;
