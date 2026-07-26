-- Add explicit attendance state columns used by AttendancePage and undo flow.
-- This prevents write failures for daily status/late details/with staff fields.

begin;

alter table public.students
  add column if not exists daily_status text,
  add column if not exists late_details jsonb,
  add column if not exists with_staff text;

-- Backfill daily_status from existing status where possible.
update public.students
set daily_status = coalesce(daily_status, status)
where daily_status is null;

commit;
