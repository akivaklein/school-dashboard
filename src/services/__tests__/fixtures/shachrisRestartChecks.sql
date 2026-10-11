\set ON_ERROR_STOP on
begin;
create or replace function public.dashboard_is_admin() returns boolean language sql stable as $$ select false $$;
do $$
declare
  opened jsonb;
  restarted jsonb;
  started jsonb;
  old_id uuid;
  new_id uuid;
  old_start timestamptz;
  records_before jsonb;
  events_before jsonb;
begin
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  old_id := (opened->'session'->>'id')::uuid;
  started := public.shachris_start_session(old_id, 'Editor');
  old_start := (started->>'started_at')::timestamptz;
  perform public.shachris_bulk_arrive_at_start(old_id, array[1]::bigint[], 'Editor');
  perform public.shachris_record_presence_event(old_id, 1, 'left', 'without', 'Editor');
  perform public.shachris_update_daily_fact(old_id, 2, 'nonattendance', '{"status":"excused"}', 'Editor', 0);
  update public.shachris_student_records set note = 'Preserved test note', said_section_ids = '["baruch-sheamar"]', rating_id = 'vg',
    requirement_result = 'met', requirement_met_at = clock_timestamp(), requirement_met_milestone = 'shemoneh-esrei',
    personally_cleared_at = clock_timestamp(), personally_cleared_by = auth.uid(), personally_cleared_by_name = 'Editor', personally_cleared_milestone = 'shemoneh-esrei',
    extra_stay_intervals = jsonb_build_array(jsonb_build_object('startedAt', clock_timestamp(), 'endedAt', null)), stayed_beyond_required = true,
    historical_result = '{"status":"present","onTime":true,"stayedRequired":true,"lateReason":"no_reason","lateExcused":false,"lateReasonNote":"","note":"Historical fact"}'
    where session_id = old_id and student_id = 1;
  update public.shachris_sessions set milestone_times = milestone_times || jsonb_build_object('shemoneh-esrei', clock_timestamp(), 'chazaras-hashatz', clock_timestamp(), 'end-davening', clock_timestamp()) where id = old_id;
  select jsonb_agg(to_jsonb(record) order by student_id) into records_before from public.shachris_student_records record where session_id = old_id;
  select jsonb_agg(to_jsonb(event) order by id) into events_before from public.shachris_events event where session_id = old_id;
  begin
    perform public.shachris_correct_start(old_id, 'restart', null, old_start, 'No confirmation', 'Editor', false);
    raise exception 'Missing confirmation accepted';
  exception when raise_exception then if sqlerrm <> 'Confirm the restart and provide a reason and actor' then raise; end if; end;
  perform set_config('test.denied', 'edit', true);
  begin
    perform public.shachris_correct_start(old_id, 'restart', null, old_start, 'View only', 'Editor', true);
    raise exception 'View-only restart accepted';
  exception when raise_exception then if sqlerrm <> 'Shachris editing denied' then raise; end if; end;
  perform set_config('test.denied', '', true);
  begin
    perform public.shachris_correct_start(old_id, 'restart', null, old_start, '', 'Editor', true);
    raise exception 'Missing reason accepted';
  exception when raise_exception then if sqlerrm <> 'Confirm the restart and provide a reason and actor' then raise; end if; end;
  begin
    perform public.shachris_correct_start(old_id, 'restart', null, old_start - interval '1 minute', 'Stale start', 'Editor', true);
    raise exception 'Stale start accepted';
  exception when raise_exception then if sqlerrm <> 'Hodu start changed. Reload before restarting.' then raise; end if; end;
  opened := public.shachris_open_session(current_date - 1, array[1,2]::bigint[]);
  begin
    perform public.shachris_correct_start((opened->'session'->>'id')::uuid, 'restart', null, null, 'Yesterday invalid', 'Editor', true);
    raise exception 'Yesterday restart accepted';
  exception when raise_exception then if sqlerrm <> 'Only today session can be corrected' then raise; end if; end;
  restarted := public.shachris_correct_start(old_id, 'restart', null, old_start, 'Restart test session', 'Editor', true);
  new_id := (restarted->'session'->>'id')::uuid;
  if new_id = old_id or restarted->'session'->'started_at' <> 'null'::jsonb or restarted->'session'->'milestone_times' <> '{}'::jsonb then raise exception 'Session not fresh'; end if;
  if jsonb_array_length(restarted->'records') <> 2 or exists(select 1 from public.shachris_student_records where session_id = new_id and
    (presence <> 'unmarked' or arrival_at is not null or late_reason is not null or late_excused or absence_status is not null or last_return_at is not null or leave_intervals <> '[]'::jsonb
    or late_minutes is not null or late_reason_note <> '' or personally_cleared_at is not null or personally_cleared_by is not null or personally_cleared_by_name <> '' or personally_cleared_milestone is not null
    or requirement_result <> 'pending' or requirement_met_at is not null or requirement_met_milestone is not null or rating_id <> '' or note <> '' or historical_result is not null
    or said_section_ids <> '[]'::jsonb or extra_stay_intervals <> '[]'::jsonb or stayed_beyond_required)) then raise exception 'Fresh records retain daily facts'; end if;
  if (select jsonb_agg(to_jsonb(record) order by student_id) from public.shachris_student_records record where session_id = old_id) <> records_before
    or (select jsonb_agg(to_jsonb(event) order by id) from public.shachris_events event where session_id = old_id) <> events_before then raise exception 'Original history changed'; end if;
  if (select count(*) from public.shachris_start_audit where session_id = old_id and action = 'restarted' and actor_name = 'Editor' and reason = 'Restart test session' and created_by = auth.uid()
    and detail->>'newSessionId' = new_id::text) <> 1 then raise exception 'Restart audit incomplete'; end if;
  if (public.shachris_open_session(current_date, array[1,2]::bigint[])->'session'->>'id')::uuid <> new_id then raise exception 'Reopen selected voided session'; end if;
  begin
    perform public.shachris_correct_start(old_id, 'restart', null, old_start, 'Duplicate stale restart', 'Editor', true);
    raise exception 'Duplicate restart accepted';
  exception when raise_exception then if sqlerrm <> 'Session was restarted. Reload the active session.' then raise; end if; end;
  begin
    perform public.shachris_record_presence_event(old_id, 1, 'returned', null, 'Editor');
    raise exception 'Stale arrival write accepted';
  exception when raise_exception then if sqlerrm <> 'Session was restarted. Reload the active session.' then raise; end if; end;
  begin
    update public.shachris_student_records set note = 'Stale overwrite' where session_id = old_id and student_id = 1;
    raise exception 'Voided history update accepted';
  exception when raise_exception then if sqlerrm <> 'Session was restarted. Reload the active session.' then raise; end if; end;
  if not exists(select 1 from jsonb_array_elements(public.shachris_start_correction_state(new_id)->'audit') entry where entry->>'action' = 'restarted') then raise exception 'Restart audit not visible from fresh session'; end if;
  restarted := public.shachris_correct_start(new_id, 'restart', null, null, 'Restart unstarted today', 'Editor', true);
  if (select count(*) from public.shachris_sessions where session_date = current_date and voided_at is null) <> 1 then raise exception 'Active date is not unique'; end if;
  if not exists(select 1 from public.shachris_sessions where id = (opened->'session'->>'id')::uuid and voided_at is null) then raise exception 'Restart changed another date'; end if;
  if has_function_privilege('anon', 'public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean)', 'execute')
    or has_function_privilege('authenticated', 'public.shachris_correct_start_before_restart(uuid,text,timestamptz,timestamptz,text,text,boolean)', 'execute') then raise exception 'Unsafe RPC grants'; end if;
end $$;
rollback;
select 'PASS: nonadmin today restart, fresh defaults, immutable old records/events, active date reopen, restart audit, permission/confirmation/stale guards; rolled back' as result;