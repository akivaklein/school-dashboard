alter table public.students
  add column if not exists departure_details jsonb;