begin;

-- Align legacy students schema with secure app payload fields used by
-- createStudentRecord/updateStudentRecord.
alter table public.students
  add column if not exists services jsonb,
  add column if not exists breakfast jsonb,
  add column if not exists detention boolean,
  add column if not exists iep boolean,
  add column if not exists iep_details text;

update public.students
set
  services = coalesce(services, '[]'::jsonb),
  breakfast = coalesce(breakfast, '[]'::jsonb),
  detention = coalesce(detention, false),
  iep = coalesce(iep, false),
  iep_details = coalesce(iep_details, '')
where true;

alter table public.students
  alter column services set default '[]'::jsonb,
  alter column services set not null,
  alter column breakfast set default '[]'::jsonb,
  alter column breakfast set not null,
  alter column detention set default false,
  alter column detention set not null,
  alter column iep set default false,
  alter column iep set not null,
  alter column iep_details set default '',
  alter column iep_details set not null;

create index if not exists idx_students_services_gin on public.students using gin(services);
create index if not exists idx_students_breakfast_gin on public.students using gin(breakfast);

commit;