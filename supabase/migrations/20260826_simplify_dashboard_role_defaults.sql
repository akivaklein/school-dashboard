begin;

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

update public.user_roles
set permissions = public.dashboard_default_permissions(role),
    updated_at = timezone('utc', now())
where role in ('admin', 'teacher', 'rebbe', 'support_staff', 'register');

grant execute on function public.dashboard_default_permissions(text) to authenticated;

commit;
