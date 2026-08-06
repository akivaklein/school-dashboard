begin;

------------------------------------------------------------
-- 1) user_roles table (idempotent) + bootstrap admin user
------------------------------------------------------------

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_roles_role_check
    check (role in ('admin', 'teacher', 'therapist', 'office', 'store'))
);

alter table public.user_roles add column if not exists role text;
alter table public.user_roles add column if not exists display_name text;
alter table public.user_roles add column if not exists is_active boolean;
alter table public.user_roles add column if not exists created_at timestamptz;
alter table public.user_roles add column if not exists updated_at timestamptz;

update public.user_roles
set
  display_name = coalesce(nullif(display_name, ''), 'Staff'),
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where true;

alter table public.user_roles
  alter column role set not null,
  alter column display_name set default '',
  alter column display_name set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column created_at set default timezone('utc', now()),
  alter column created_at set not null,
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

create unique index if not exists user_roles_user_id_uidx on public.user_roles(user_id);
create index if not exists user_roles_role_active_idx on public.user_roles(role, is_active);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_roles_role_check'
      and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles
      add constraint user_roles_role_check
      check (role in ('admin', 'teacher', 'therapist', 'office', 'store'));
  end if;
end $$;

create or replace function public.user_roles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_roles_set_updated_at on public.user_roles;
create trigger trg_user_roles_set_updated_at
before update on public.user_roles
for each row
execute function public.user_roles_set_updated_at();

insert into public.user_roles (user_id, role, display_name, is_active)
values (
  '7ac63643-948e-438b-bc2c-dd3cae19b8b0',
  'admin',
  'Yeshiva Ketana Admin',
  true
)
on conflict (user_id) do update
set
  role = excluded.role,
  display_name = excluded.display_name,
  is_active = true,
  updated_at = timezone('utc', now());

------------------------------------------------------------
-- 2) Auth helper functions based on user_roles
------------------------------------------------------------

create or replace function public.dashboard_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.is_active is true
  limit 1
$$;

create or replace function public.dashboard_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.dashboard_current_role() = 'admin', false)
$$;

------------------------------------------------------------
-- 3) RLS for user_roles (user can read own active role)
------------------------------------------------------------

alter table public.user_roles enable row level security;

drop policy if exists user_roles_select_own_active on public.user_roles;
drop policy if exists user_roles_select_admin_all on public.user_roles;
drop policy if exists user_roles_insert_admin on public.user_roles;
drop policy if exists user_roles_update_admin on public.user_roles;
drop policy if exists user_roles_delete_admin on public.user_roles;

create policy user_roles_select_own_active
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  and is_active is true
);

create policy user_roles_select_admin_all
on public.user_roles
for select
to authenticated
using (public.dashboard_is_admin());

create policy user_roles_insert_admin
on public.user_roles
for insert
to authenticated
with check (public.dashboard_is_admin());

create policy user_roles_update_admin
on public.user_roles
for update
to authenticated
using (public.dashboard_is_admin())
with check (public.dashboard_is_admin());

create policy user_roles_delete_admin
on public.user_roles
for delete
to authenticated
using (public.dashboard_is_admin());

grant select, insert, update, delete on table public.user_roles to authenticated;
revoke all on table public.user_roles from anon;

------------------------------------------------------------
-- 4) Secure all dashboard app tables: authenticated admin only
--    Drops existing per-table policies (including old anon portal policies)
------------------------------------------------------------

do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array[
    'students',
    'points_events',
    'support_sessions',
    'student_notes',
    'store_items',
    'store_redemptions',
    'staff',
    'student_flags',
    'todos',
    'login_sessions',
    'teaching_actions',
    'vip_rules',
    'store_sales',
    'setup_assignments',
    'therapy_schedule',
    'staff_accounts',
    'setup_center_config',
    'grade_entries',
    'student_class_assignments',
    'teacher_rebbe_assignments'
  ]
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', tbl);

    -- Drop all existing policies on this table to eliminate legacy broad access.
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;

    -- Recreate strict admin-only policies.
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.dashboard_is_admin())',
      tbl || '_admin_select',
      tbl
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.dashboard_is_admin())',
      tbl || '_admin_insert',
      tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.dashboard_is_admin()) with check (public.dashboard_is_admin())',
      tbl || '_admin_update',
      tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.dashboard_is_admin())',
      tbl || '_admin_delete',
      tbl
    );

    execute format('grant select, insert, update, delete on table public.%I to authenticated', tbl);
    execute format('revoke all on table public.%I from anon', tbl);
  end loop;
end $$ language plpgsql;

------------------------------------------------------------
-- 5) Sequence hardening: no anon access, authenticated usable
------------------------------------------------------------

do $$
declare
  seq record;
begin
  for seq in
    select schemaname, sequencename
    from pg_sequences
    where schemaname = 'public'
  loop
    execute format('revoke all on sequence %I.%I from anon', seq.schemaname, seq.sequencename);
    execute format('grant usage, select on sequence %I.%I to authenticated', seq.schemaname, seq.sequencename);
  end loop;
end $$ language plpgsql;

commit;
