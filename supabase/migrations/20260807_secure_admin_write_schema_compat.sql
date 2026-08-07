begin;

-- Compatibility patch for legacy secure deployments where students.division
-- was not present before secure admin write-path enforcement.
alter table public.students
  add column if not exists division text;

update public.students
set division = 'yeshiva-ketana'
where division is null or btrim(division) = '';

alter table public.students
  alter column division set default 'yeshiva-ketana',
  alter column division set not null;

create index if not exists students_division_idx on public.students(division);

commit;