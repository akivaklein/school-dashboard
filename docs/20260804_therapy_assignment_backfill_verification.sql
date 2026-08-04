-- Run these queries in Supabase before and after applying the follow-up migration.

-- 1) How many rows are eligible before running?
select count(*) as eligible_rows_before
from public.students
where (therapy_assignments is null or therapy_assignments = '[]'::jsonb)
  and nullif(btrim(assigned_therapist), '') is not null;

-- 2) How many rows were backfilled?
select count(*) as backfilled_rows_after
from public.students
where therapy_assignments is not null
  and therapy_assignments <> '[]'::jsonb
  and nullif(btrim(assigned_therapist), '') is not null;

-- 3) Whether any blank-provider assignments exist afterward.
select count(*) as blank_provider_assignments_after
from public.students
where therapy_assignments is not null
  and therapy_assignments <> '[]'::jsonb
  and exists (
    select 1
    from jsonb_array_elements(therapy_assignments) as assignment(row)
    where nullif(btrim(coalesce(assignment.row->>'provider', '')), '') is null
  );

-- 4) Whether any duplicate legacy assignment IDs exist afterward.
select count(*) as duplicate_legacy_assignment_ids_after
from (
  select id, assignment_id, count(*) as occurrences
  from (
    select
      s.id,
      assignment.row->>'id' as assignment_id
    from public.students as s
    cross join lateral jsonb_array_elements(coalesce(s.therapy_assignments, '[]'::jsonb)) as assignment(row)
    where assignment.row->>'id' like 'legacy-therapy-%'
  ) legacy_assignments
  group by id, assignment_id
  having count(*) > 1
) duplicates;