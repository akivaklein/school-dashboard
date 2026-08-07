begin;

alter table public.student_notes
  add column if not exists created_by_user_id uuid,
  add column if not exists created_by_name text,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by_user_id uuid,
  add column if not exists updated_by_name text,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_user_id uuid,
  add column if not exists deleted_by_name text;

update public.student_notes
set
  created_by_name = coalesce(created_by_name, author),
  updated_at = coalesce(updated_at, created_at),
  is_deleted = coalesce(is_deleted, false)
where true;

create or replace function public.student_notes_set_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by_user_id is null then
      new.created_by_user_id := auth.uid();
    end if;

    if coalesce(new.created_by_name, '') = '' then
      new.created_by_name := coalesce(new.author, 'Staff');
    end if;

    if new.updated_at is null then
      new.updated_at := new.created_at;
    end if;

    return new;
  end if;

  new.updated_at := timezone('utc', now());

  if auth.uid() is not null then
    new.updated_by_user_id := auth.uid();
  end if;

  if coalesce(new.updated_by_name, '') = '' then
    new.updated_by_name := coalesce(new.author, new.created_by_name, 'Staff');
  end if;

  if coalesce(old.is_deleted, false) = false and coalesce(new.is_deleted, false) = true then
    if new.deleted_at is null then
      new.deleted_at := timezone('utc', now());
    end if;

    if auth.uid() is not null then
      new.deleted_by_user_id := auth.uid();
    end if;

    if coalesce(new.deleted_by_name, '') = '' then
      new.deleted_by_name := coalesce(new.updated_by_name, new.author, 'Staff');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_student_notes_set_metadata on public.student_notes;
create trigger trg_student_notes_set_metadata
before insert or update on public.student_notes
for each row
execute function public.student_notes_set_metadata();

drop policy if exists student_notes_select_portal on public.student_notes;
drop policy if exists student_notes_insert_portal on public.student_notes;
drop policy if exists student_notes_update_portal on public.student_notes;
drop policy if exists student_notes_delete_portal on public.student_notes;
drop policy if exists student_notes_select_authenticated on public.student_notes;
drop policy if exists student_notes_insert_staff on public.student_notes;
drop policy if exists student_notes_update_staff on public.student_notes;
drop policy if exists student_notes_delete_admin on public.student_notes;
drop policy if exists student_notes_select_authenticated_all on public.student_notes;
drop policy if exists student_notes_insert_authenticated_staff on public.student_notes;
drop policy if exists student_notes_update_admin_or_author on public.student_notes;
drop policy if exists student_notes_delete_admin_only on public.student_notes;

create policy student_notes_select_authenticated_all
on public.student_notes
for select
to authenticated
using (
  coalesce(is_deleted, false) = false
  or public.dashboard_is_admin()
);

create policy student_notes_insert_authenticated_staff
on public.student_notes
for insert
to authenticated
with check (
  public.dashboard_current_role() in ('admin', 'teacher', 'rebbe', 'support_staff')
);

create policy student_notes_update_admin_or_author
on public.student_notes
for update
to authenticated
using (
  public.dashboard_is_admin()
  or (
    created_by_user_id is not null
    and auth.uid() is not null
    and created_by_user_id = auth.uid()
  )
)
with check (
  public.dashboard_is_admin()
  or (
    created_by_user_id is not null
    and auth.uid() is not null
    and created_by_user_id = auth.uid()
  )
);

create policy student_notes_delete_admin_only
on public.student_notes
for delete
to authenticated
using (public.dashboard_is_admin());

revoke all on public.student_notes from anon;
grant select, insert, update, delete on public.student_notes to authenticated;

commit;
