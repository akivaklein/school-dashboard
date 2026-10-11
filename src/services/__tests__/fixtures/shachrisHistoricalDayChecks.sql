\set ON_ERROR_STOP on
begin;

do $$
declare
  result_value jsonb := '{"status":"present","onTime":true,"stayedRequired":true,"lateReason":"no_reason","lateExcused":false,"lateReasonNote":"","note":"Entered after tablet arrived"}'::jsonb;
  saved jsonb;
  first_record jsonb;
  original_record jsonb;
  first_event jsonb;
  previous_day date := current_date - 14 - extract(dow from current_date)::integer;
  correction_day date := previous_day - 7;
  session_id_value uuid;
  snapshot_count integer;
begin
  saved := public.shachris_save_historical_day(previous_day, 1, result_value, null, 'Backfill from paper', 'QA Editor');
  first_record := saved->'record';
  session_id_value := (saved->'session'->>'id')::uuid;
  if saved->'session'->'started_at' <> 'null'::jsonb or saved->'session'->'milestone_times' <> '{}'::jsonb then raise exception 'Backfill fabricated session timing'; end if;
  if first_record->'arrival_at' <> 'null'::jsonb or first_record->>'presence' <> 'unmarked' or first_record->'historical_result' <> result_value then raise exception 'Backfill fabricated live attendance'; end if;
  if (select count(*) from public.shachris_student_records where session_id = session_id_value) <> 1 then raise exception 'Backfill created other student records'; end if;
  select to_jsonb(event) into first_event from public.shachris_events event where session_id = session_id_value and student_id = 1;
  if first_event->'detail'->'before' <> 'null'::jsonb or first_event->'detail'->'after' <> first_record or first_event->'detail'->>'reason' <> 'Backfill from paper'
    or first_event->>'created_by' <> auth.uid()::text or first_event->>'actor_name' <> 'QA Editor' then raise exception 'Initial audit incomplete'; end if;
  saved := public.shachris_save_historical_day(previous_day, 1, result_value || '{"onTime":false,"lateReason":"transportation","lateExcused":true}'::jsonb, 1, 'Corrected paper result', 'QA Editor Two');
  if (select count(*) from public.shachris_events where session_id = session_id_value and student_id = 1) <> 2 then raise exception 'Correction did not append audit'; end if;
  if not exists(select 1 from public.shachris_events where session_id = session_id_value and detail->'before' = first_record and detail->'after' = saved->'record') then raise exception 'Correction before/after missing'; end if;
  if not exists(select 1 from public.shachris_events event where to_jsonb(event) = first_event) then raise exception 'Original event changed'; end if;
  begin
    perform public.shachris_save_historical_day(previous_day, 1, result_value, 1, 'Stale save', 'QA');
    raise exception 'Stale save accepted';
  exception when raise_exception then if sqlerrm not like 'Day changed.%' then raise; end if; end;

  insert into public.shachris_sessions(session_date, config, started_at, milestone_times)
    select correction_day, config, correction_day + time '07:00', jsonb_build_object('shemoneh-esrei', correction_day + time '07:30') from public.shachris_settings
    returning id into session_id_value;
  insert into public.shachris_student_records(session_id, student_id, expectation, stay_requirement, presence, arrival_at, leave_intervals, note, personally_cleared_at)
    select session_id_value, 2, public.shachris_resolve_expectation(2, correction_day, config), public.shachris_resolve_stay_requirement(2, correction_day, config),
      'present', correction_day + time '07:02', jsonb_build_array(jsonb_build_object('leftAt', correction_day + time '07:10', 'returnedAt', correction_day + time '07:12', 'permission', 'with')), 'Original note', correction_day + time '07:31'
      from public.shachris_settings;
  select to_jsonb(record) into original_record from public.shachris_student_records record where session_id = session_id_value and student_id = 2;
  saved := public.shachris_save_historical_day(correction_day, 2, result_value || '{"status":"excused","onTime":null,"stayedRequired":null}'::jsonb, 0, 'Excused absence correction', 'QA');
  if ((saved->'record') - 'historical_result' - 'revision' - 'updated_at' - 'updated_by' - 'updated_by_name') <> (original_record - 'historical_result' - 'revision' - 'updated_at' - 'updated_by' - 'updated_by_name') then raise exception 'Original daily facts overwritten'; end if;

  select count(*) into snapshot_count from public.shachris_events;
  begin
    perform public.shachris_save_historical_day(current_date, 1, result_value, null, 'Today invalid', 'QA');
    raise exception 'Today accepted';
  exception when raise_exception then if sqlerrm <> 'Choose a previous school day' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(current_date + 1, 1, result_value, null, 'Future invalid', 'QA');
    raise exception 'Future accepted';
  exception when raise_exception then if sqlerrm <> 'Choose a previous school day' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(previous_day - 1, 1, result_value, null, 'Saturday invalid', 'QA');
    raise exception 'Saturday accepted';
  exception when raise_exception then if sqlerrm <> 'Choose a previous school day' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(previous_day, 3, result_value, null, 'Archived invalid', 'QA');
    raise exception 'Archived accepted';
  exception when raise_exception then if sqlerrm <> 'Student is not in the active Shachris roster' then raise; end if; end;
  update public.student_class_assignments set class_id = 'mesivta-8' where student_id = 2;
  begin
    perform public.shachris_save_historical_day(previous_day, 2, result_value, null, 'Other division invalid', 'QA');
    raise exception 'Other division accepted';
  exception when raise_exception then if sqlerrm <> 'Student is not in the active Shachris roster' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(previous_day, 1, result_value, 2, '', 'QA');
    raise exception 'Empty reason accepted';
  exception when raise_exception then if sqlerrm <> 'Provide an edit reason and actor' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(previous_day, 1, result_value || '{"arrival_at":"2020-01-01"}'::jsonb, 2, 'Forged timestamp', 'QA');
    raise exception 'Unknown fields accepted';
  exception when raise_exception then if sqlerrm <> 'Invalid historical result' then raise; end if; end;
  begin
    perform public.shachris_save_historical_day(previous_day, 1, result_value || '{"onTime":null}'::jsonb, 2, 'Incomplete', 'QA');
    raise exception 'Incomplete result accepted';
  exception when raise_exception then if sqlerrm <> 'Choose arrival and required-stay results' then raise; end if; end;
  perform set_config('test.denied', 'edit', true);
  begin
    perform public.shachris_save_historical_day(previous_day, 1, result_value, 2, 'View-only invalid', 'QA');
    raise exception 'View-only accepted';
  exception when raise_exception then if sqlerrm <> 'Shachris editing denied' then raise; end if; end;
  perform set_config('test.denied', '', true);
  if (select count(*) from public.shachris_events) <> snapshot_count then raise exception 'Rejected writes left audit changes'; end if;
  if has_function_privilege('anon', 'public.shachris_save_historical_day(date,bigint,jsonb,integer,text,text)', 'execute')
    or has_table_privilege('authenticated', 'public.shachris_student_records', 'update')
    or has_table_privilege('authenticated', 'public.shachris_events', 'update') then raise exception 'Unsafe direct write privileges'; end if;
end $$;

create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
do $$
begin
  begin
    perform public.shachris_save_historical_day(current_date - 14, 1, '{}'::jsonb, null, 'Unauthenticated', 'QA');
    raise exception 'Missing identity accepted';
  exception when raise_exception then if sqlerrm <> 'Shachris editing denied' then raise; end if; end;
end $$;

rollback;
select 'PASS: historical backfill/correction audit, original facts preserved, stale/date/roster/identity/permission/validation guards; all checks rolled back' as result;