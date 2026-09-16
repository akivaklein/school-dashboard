begin;

create table if not exists public.student_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id bigint not null references public.students(id) on delete cascade,
  title text not null,
  note text,
  due_at timestamptz not null,
  repeat_type text not null default 'one_time'
    check (repeat_type in ('one_time', 'daily_until_done')),
  created_by text not null default 'Staff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  completed_by text
);

create index if not exists student_tasks_student_due_idx
  on public.student_tasks (student_id, due_at);
create index if not exists student_tasks_open_due_idx
  on public.student_tasks (completed_at, due_at);

create or replace function public.student_tasks_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_student_tasks_set_updated_at on public.student_tasks;
create trigger trg_student_tasks_set_updated_at
before update on public.student_tasks
for each row execute function public.student_tasks_set_updated_at();

alter table public.student_tasks enable row level security;
revoke all on table public.student_tasks from anon;
grant select, insert, update, delete on table public.student_tasks to authenticated;

drop policy if exists student_tasks_select_staff on public.student_tasks;
drop policy if exists student_tasks_insert_staff on public.student_tasks;
drop policy if exists student_tasks_update_staff on public.student_tasks;
drop policy if exists student_tasks_delete_staff on public.student_tasks;

create policy student_tasks_select_staff
on public.student_tasks for select to authenticated
using (
  public.dashboard_is_leadership()
  or public.dashboard_current_role() = 'support_staff'
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1 from public.teacher_rebbe_assignments tra
      where tra.student_id = student_tasks.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name from public.user_roles ur
          where ur.user_id = auth.uid() and ur.is_active is true
          limit 1
        )))
    )
  )
);

create policy student_tasks_insert_staff
on public.student_tasks for insert to authenticated
with check (
  public.dashboard_is_leadership()
  or public.dashboard_current_role() = 'support_staff'
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1 from public.teacher_rebbe_assignments tra
      where tra.student_id = student_tasks.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name from public.user_roles ur
          where ur.user_id = auth.uid() and ur.is_active is true
          limit 1
        )))
    )
  )
);

create policy student_tasks_update_staff
on public.student_tasks for update to authenticated
using (
  public.dashboard_is_leadership()
  or public.dashboard_current_role() = 'support_staff'
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1 from public.teacher_rebbe_assignments tra
      where tra.student_id = student_tasks.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name from public.user_roles ur
          where ur.user_id = auth.uid() and ur.is_active is true
          limit 1
        )))
    )
  )
)
with check (
  public.dashboard_is_leadership()
  or public.dashboard_current_role() = 'support_staff'
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1 from public.teacher_rebbe_assignments tra
      where tra.student_id = student_tasks.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name from public.user_roles ur
          where ur.user_id = auth.uid() and ur.is_active is true
          limit 1
        )))
    )
  )
);

create policy student_tasks_delete_staff
on public.student_tasks for delete to authenticated
using (
  public.dashboard_is_leadership()
  or public.dashboard_current_role() = 'support_staff'
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1 from public.teacher_rebbe_assignments tra
      where tra.student_id = student_tasks.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name from public.user_roles ur
          where ur.user_id = auth.uid() and ur.is_active is true
          limit 1
        )))
    )
  )
);

commit;
