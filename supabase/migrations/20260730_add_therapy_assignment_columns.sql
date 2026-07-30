-- Persist therapist assignment rows and legacy therapy summary fields on students.
alter table if exists public.students
add column if not exists therapy_assignments jsonb default '[]'::jsonb,
add column if not exists assigned_therapist text,
add column if not exists therapy_frequency text,
add column if not exists therapy_notes text;

create index if not exists idx_students_therapy_assignments_gin
  on public.students using gin (therapy_assignments);

comment on column public.students.therapy_assignments is
  'Array of therapist assignment objects with provider, service type, day/date, start/end time, recurrence, custom weekdays, affected period, notes, and active state.';
