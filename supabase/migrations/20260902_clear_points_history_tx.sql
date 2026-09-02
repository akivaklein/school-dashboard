------------------------------------------------------------
-- Atomic Points/Behavior History Cleanup RPC
-- Unlinks store_redemptions -> points_events before deleting points_events
-- to prevent foreign key constraint violations (store_redemptions_points_event_id_fkey)
-- and preserve store purchase history.
------------------------------------------------------------

create or replace function public.clear_points_history_tx(
  p_actor_name text default 'Admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
begin
  if not (public.dashboard_is_admin() or public.dashboard_is_leadership()) then
    raise exception 'Unauthorized: Admin or leadership role required for points history cleanup.';
  end if;

  v_actor := coalesce(nullif(trim(p_actor_name), ''), 'Admin');

  -- 1) Clear foreign key references on store_redemptions so redemption history is preserved
  --    without blocking deletion of points_events rows.
  update public.store_redemptions
  set points_event_id = null,
      reversal_event_id = null
  where points_event_id is not null
     or reversal_event_id is not null;

  -- 2) Clear self-referencing related_event_id links on points_events
  update public.points_events
  set related_event_id = null
  where related_event_id is not null;

  -- 3) Delete all points_events rows
  delete from public.points_events
  where id is not null;

  -- 4) Reset student point balances, reminder counts, and behavior logs
  update public.students
  set token_balance = 0,
      reminders = 0,
      behavior_log = '[]'::jsonb
  where id is not null;

  -- 5) Record audit log
  insert into public.audit_logs (
    user_name,
    action,
    target_table,
    target_id,
    metadata
  ) values (
    v_actor,
    'admin_clear_points_history',
    'students',
    'all',
    '{}'::jsonb
  );

  return jsonb_build_object(
    'success', true
  );
exception when others then
  raise exception 'clear_points_history_tx failed: %', SQLERRM;
end;
$$;

grant execute on function public.clear_points_history_tx(text) to authenticated;
