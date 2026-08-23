begin;

------------------------------------------------------------
-- 1) Add the students.grade column the secure admin writer needs.
--    Fixes: "Could not find the 'grade' column of 'students'
--    in the schema cache."
------------------------------------------------------------

alter table public.students add column if not exists grade text;

------------------------------------------------------------
-- 2) Backfill grade from the legacy Yeshiva Ketana class names.
--    Alef -> 8th Grade, Beis -> 7th Grade.
--    Only fills rows that do not already carry a usable grade.
------------------------------------------------------------

update public.students
set grade = case
  when lower(coalesce(class_name, '')) like '%alef%' then '8'
  when lower(coalesce(class_name, '')) like '%beis%' then '7'
  when lower(coalesce(class_name, '')) like '%beit%' then '7'
  when lower(coalesce(class_name, '')) like '%8%' then '8'
  when lower(coalesce(class_name, '')) like '%7%' then '7'
  else grade
end
where coalesce(nullif(trim(grade), ''), '') not in ('7', '8');

-- Normalize any pre-existing free-text grade values to '7' / '8'.
update public.students
set grade = case
  when lower(trim(grade)) in ('7', '7th', '7th grade', 'grade 7') then '7'
  when lower(trim(grade)) in ('8', '8th', '8th grade', 'grade 8') then '8'
  else grade
end
where coalesce(nullif(trim(grade), ''), '') not in ('7', '8');

alter table public.students
  alter column grade set default '';

update public.students set grade = coalesce(grade, '') where grade is null;

create index if not exists students_grade_idx on public.students(grade);

------------------------------------------------------------
-- 3) Rename the displayed class names.
--    "Yeshiva Ketana Alef" -> "8th Grade"
--    "Yeshiva Ketana Beis" -> "7th Grade"
--    Student assignments are preserved: only the label changes.
------------------------------------------------------------

update public.students
set class_name = '8th Grade'
where lower(coalesce(class_name, '')) like '%alef%';

update public.students
set class_name = '7th Grade'
where lower(coalesce(class_name, '')) like '%beis%'
   or lower(coalesce(class_name, '')) like '%beit%';

-- Keep class_name and grade in sync for every remaining row that has a grade.
update public.students
set class_name = case grade when '8' then '8th Grade' when '7' then '7th Grade' else class_name end
where grade in ('7', '8')
  and class_name is distinct from (case grade when '8' then '8th Grade' else '7th Grade' end);

------------------------------------------------------------
-- 4) Rename the same labels in dependent tables, when present.
------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_rebbe_assignments' and column_name = 'class_name'
  ) then
    execute $sql$
      update public.teacher_rebbe_assignments
      set class_name = case
        when lower(coalesce(class_name, '')) like '%alef%' then '8th Grade'
        when lower(coalesce(class_name, '')) like '%beis%' then '7th Grade'
        when lower(coalesce(class_name, '')) like '%beit%' then '7th Grade'
        else class_name
      end
      where lower(coalesce(class_name, '')) similar to '%(alef|beis|beit)%'
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'student_class_assignments' and column_name = 'class_name'
  ) then
    execute $sql$
      update public.student_class_assignments
      set class_name = case
        when lower(coalesce(class_name, '')) like '%alef%' then '8th Grade'
        when lower(coalesce(class_name, '')) like '%beis%' then '7th Grade'
        when lower(coalesce(class_name, '')) like '%beit%' then '7th Grade'
        else class_name
      end
      where lower(coalesce(class_name, '')) similar to '%(alef|beis|beit)%'
    $sql$;
  end if;
end
$$;

commit;

------------------------------------------------------------
-- Verification (run separately, read-only):
--
--   select grade, class_name, count(*)
--   from public.students
--   where is_active is true
--   group by grade, class_name
--   order by grade;
--
-- Expect only ('7','7th Grade') and ('8','8th Grade') rows.
------------------------------------------------------------
