create table if not exists public.student_flags (
  id text primary key,
  student_id bigint references public.students(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists student_flags_student_id_idx
  on public.student_flags (student_id);

create index if not exists student_flags_created_at_idx
  on public.student_flags (created_at desc);

comment on table public.student_flags is
  'Persisted student support flags. payload stores the full client flag object to preserve feature flexibility while migrating from local-only state.';
