begin;

alter table public.user_roles
  add column if not exists permissions jsonb not null default '{}'::jsonb,
  add column if not exists invited_at timestamptz,
  add column if not exists invited_by uuid references auth.users(id) on delete set null;

create or replace function public.dashboard_default_permissions(p_role text)
returns jsonb
language sql
stable
as $$
  select case lower(coalesce(p_role, ''))
    when 'admin' then '{"students":"delete","attendance":"delete","grades":"delete","behavior":"delete","store":"delete","reports":"view","setup":"delete","users":"delete"}'::jsonb
    when 'teacher' then '{"students":"delete","attendance":"delete","grades":"delete","behavior":"delete","store":"delete","reports":"delete","setup":"delete","users":"delete"}'::jsonb
    when 'rebbe' then '{"students":"delete","attendance":"delete","grades":"delete","behavior":"delete","store":"delete","reports":"delete","setup":"delete","users":"delete"}'::jsonb
    when 'support_staff' then '{"students":"delete","attendance":"delete","grades":"delete","behavior":"delete","store":"delete","reports":"delete","setup":"delete","users":"delete"}'::jsonb
    when 'register' then '{"students":"none","attendance":"none","grades":"none","behavior":"none","store":"add","reports":"none","setup":"none","users":"none"}'::jsonb
    else '{"students":"none","attendance":"none","grades":"none","behavior":"none","store":"none","reports":"none","setup":"none","users":"none"}'::jsonb
  end
$$;

create or replace function public.dashboard_current_permissions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(ur.permissions, '{}'::jsonb), public.dashboard_default_permissions(ur.role))
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.is_active is true
  limit 1
$$;

create or replace function public.dashboard_has_permission(p_section text, p_minimum text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with ranks(level, rank_value) as (
    values ('none', 0), ('view', 1), ('add', 2), ('edit', 3), ('delete', 4)
  ), current_level as (
    select coalesce(public.dashboard_current_permissions() ->> p_section, 'none') as level
  )
  select coalesce((
    select current_rank.rank_value >= required_rank.rank_value
    from current_level
    join ranks current_rank on current_rank.level = current_level.level
    join ranks required_rank on required_rank.level = p_minimum
  ), false)
$$;

grant execute on function public.dashboard_default_permissions(text) to authenticated;
grant execute on function public.dashboard_current_permissions() to authenticated;
grant execute on function public.dashboard_has_permission(text, text) to authenticated;

commit;
