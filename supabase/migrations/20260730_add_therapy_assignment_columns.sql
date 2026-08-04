-- Persist therapist assignment rows and legacy therapy summary fields on students.
alter table if exists public.students
add column if not exists therapy_assignments jsonb default '[]'::jsonb,
add column if not exists assigned_therapist text,
add column if not exists therapy_frequency text,
add column if not exists therapy_notes text;

update public.students
set therapy_assignments = jsonb_build_array(
  jsonb_strip_nulls(
    jsonb_build_object(
      'id', concat('legacy-therapy-', id),
      'provider', nullif(btrim(assigned_therapist), ''),
      'serviceType', 'Therapy',
      'day', null,
      'date', null,
      'startTime', null,
      'endTime', null,
      'recurrence', nullif(btrim(therapy_frequency), ''),
      'affectedPeriod', null,
      'customDays', '[]'::jsonb,
      'notes', nullif(btrim(therapy_notes), ''),
      'active', true
    )
  )
)
-- Only backfill rows that still have the new array empty and a real therapist name.
where (therapy_assignments is null or therapy_assignments = '[]'::jsonb)
  and nullif(btrim(assigned_therapist), '') is not null;

create index if not exists idx_students_therapy_assignments_gin
  on public.students using gin (therapy_assignments);

comment on column public.students.therapy_assignments is
  'Array of therapist assignment objects with provider, service type, day/date, start/end time, recurrence, custom weekdays, affected period, notes, and active state.';
