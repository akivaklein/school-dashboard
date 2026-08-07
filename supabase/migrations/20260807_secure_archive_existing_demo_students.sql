begin;

-- One-time secure cleanup: archive currently active legacy demo roster rows
-- so secure YK starts from an empty active student list before real data entry.
update public.students
set
  is_active = false,
  archived_at = coalesce(archived_at, timezone('utc', now())),
  archived_by = coalesce(nullif(archived_by, ''), 'secure_cleanup_migration')
where coalesce(is_active, true) is true;

commit;