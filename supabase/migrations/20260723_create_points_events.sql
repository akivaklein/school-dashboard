create table if not exists public.points_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  student_id bigint not null references public.students(id) on delete cascade,
  student_name text not null,
  staff_id text,
  staff_name text not null,
  staff_role text not null default 'staff',
  points_delta integer not null,
  event_type text not null,
  category text not null,
  reason text not null,
  note text,
  source_page text,
  source_context text,
  related_event_id bigint references public.points_events(id),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists points_events_student_id_created_at_idx
  on public.points_events (student_id, created_at desc);

create index if not exists points_events_created_at_idx
  on public.points_events (created_at desc);

create index if not exists points_events_staff_name_created_at_idx
  on public.points_events (staff_name, created_at desc);

create index if not exists points_events_category_created_at_idx
  on public.points_events (category, created_at desc);

comment on table public.points_events is
  'Append-only ledger for every point award, deduction, purchase, adjustment, and reversal.';

comment on column public.points_events.student_name is
  'Snapshot of the student name at the time of the event for audit readability.';

comment on column public.points_events.staff_id is
  'Optional staff identifier. Nullable because the current app does not yet use Supabase Auth-backed staff IDs.';

comment on column public.points_events.event_type is
  'High-level action such as award, deduction, reminder, purchase, adjustment, or reversal.';

comment on column public.points_events.category is
  'Workflow area such as class, therapy, behavior, store, attendance, or admin.';

comment on column public.points_events.reason is
  'Human-readable reason shown in the UI and audit history.';

comment on column public.points_events.related_event_id is
  'Optional link to another points event, intended for reversal/undo flows in a later step.';

comment on column public.points_events.metadata is
  'Flexible JSON for extra context like class name, staff display details, bulk action ids, or source-specific fields.';