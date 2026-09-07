begin;

alter table public.student_notes
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.todos
  add column if not exists student_id bigint references public.students(id) on delete set null,
  add column if not exists priority text not null default 'normal';

create table if not exists public.student_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  student_id bigint references public.students(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  target text not null,
  status text not null default 'active',
  created_by text not null,
  assigned_to text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists student_goals_student_id_created_at_idx
  on public.student_goals (student_id, created_at desc);
create index if not exists student_goals_status_idx
  on public.student_goals (status);
create index if not exists student_goals_assigned_to_idx
  on public.student_goals (assigned_to);
create index if not exists student_goals_created_by_idx
  on public.student_goals (created_by);

alter table public.student_goals enable row level security;

revoke all on table public.student_goals from anon;
grant select, insert, update, delete on table public.student_goals to authenticated;

drop policy if exists student_goals_select_portal on public.student_goals;
drop policy if exists student_goals_insert_portal on public.student_goals;
drop policy if exists student_goals_update_portal on public.student_goals;
drop policy if exists student_goals_delete_portal on public.student_goals;
drop policy if exists student_goals_select_dashboard on public.student_goals;
drop policy if exists student_goals_insert_dashboard on public.student_goals;
drop policy if exists student_goals_update_dashboard on public.student_goals;
drop policy if exists student_goals_delete_leadership on public.student_goals;

create policy student_goals_select_dashboard
on public.student_goals
for select
to authenticated
using (
  public.dashboard_is_leadership()
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1
      from public.teacher_rebbe_assignments tra
      where tra.student_id = student_goals.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.is_active is true
          order by
            case ur.role
              when 'admin' then 0
              when 'principal' then 1
              when 'teacher' then 2
              when 'rebbe' then 3
              when 'support_staff' then 4
              else 5
            end,
            ur.role
          limit 1
        )))
    )
  )
  or (
    public.dashboard_current_role() = 'support_staff'
    and lower(trim(coalesce(student_goals.assigned_to, student_goals.created_by, ''))) = lower(trim((
      select ur.display_name
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.is_active is true
      order by
        case ur.role
          when 'admin' then 0
          when 'principal' then 1
          when 'teacher' then 2
          when 'rebbe' then 3
          when 'support_staff' then 4
          else 5
        end,
        ur.role
      limit 1
    )))
  )
);

create policy student_goals_insert_dashboard
on public.student_goals
for insert
to authenticated
with check (
  public.dashboard_is_leadership()
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1
      from public.teacher_rebbe_assignments tra
      where tra.student_id = student_goals.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.is_active is true
          order by
            case ur.role
              when 'admin' then 0
              when 'principal' then 1
              when 'teacher' then 2
              when 'rebbe' then 3
              when 'support_staff' then 4
              else 5
            end,
            ur.role
          limit 1
        )))
    )
  )
  or (
    public.dashboard_current_role() = 'support_staff'
    and lower(trim(coalesce(student_goals.assigned_to, student_goals.created_by, ''))) = lower(trim((
      select ur.display_name
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.is_active is true
      order by
        case ur.role
          when 'admin' then 0
          when 'principal' then 1
          when 'teacher' then 2
          when 'rebbe' then 3
          when 'support_staff' then 4
          else 5
        end,
        ur.role
      limit 1
    )))
  )
);

create policy student_goals_update_dashboard
on public.student_goals
for update
to authenticated
using (
  public.dashboard_is_leadership()
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1
      from public.teacher_rebbe_assignments tra
      where tra.student_id = student_goals.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.is_active is true
          order by
            case ur.role
              when 'admin' then 0
              when 'principal' then 1
              when 'teacher' then 2
              when 'rebbe' then 3
              when 'support_staff' then 4
              else 5
            end,
            ur.role
          limit 1
        )))
    )
  )
  or (
    public.dashboard_current_role() = 'support_staff'
    and lower(trim(coalesce(student_goals.assigned_to, student_goals.created_by, ''))) = lower(trim((
      select ur.display_name
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.is_active is true
      order by
        case ur.role
          when 'admin' then 0
          when 'principal' then 1
          when 'teacher' then 2
          when 'rebbe' then 3
          when 'support_staff' then 4
          else 5
        end,
        ur.role
      limit 1
    )))
  )
)
with check (
  public.dashboard_is_leadership()
  or (
    public.dashboard_current_role() in ('teacher', 'rebbe')
    and exists (
      select 1
      from public.teacher_rebbe_assignments tra
      where tra.student_id = student_goals.student_id
        and tra.status = 'active'
        and lower(trim(tra.teacher_name)) = lower(trim((
          select ur.display_name
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.is_active is true
          order by
            case ur.role
              when 'admin' then 0
              when 'principal' then 1
              when 'teacher' then 2
              when 'rebbe' then 3
              when 'support_staff' then 4
              else 5
            end,
            ur.role
          limit 1
        )))
    )
  )
  or (
    public.dashboard_current_role() = 'support_staff'
    and lower(trim(coalesce(student_goals.assigned_to, student_goals.created_by, ''))) = lower(trim((
      select ur.display_name
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.is_active is true
      order by
        case ur.role
          when 'admin' then 0
          when 'principal' then 1
          when 'teacher' then 2
          when 'rebbe' then 3
          when 'support_staff' then 4
          else 5
        end,
        ur.role
      limit 1
    )))
  )
);

create policy student_goals_delete_leadership
on public.student_goals
for delete
to authenticated
using (public.dashboard_is_leadership());

commit;