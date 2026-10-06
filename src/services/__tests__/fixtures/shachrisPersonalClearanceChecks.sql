\set ON_ERROR_STOP on
begin;
update public.students set date_of_birth = (current_date - interval '11 years')::date where id = 1;
update public.students set date_of_birth = (current_date - interval '12 years')::date where id = 2;
do $$
declare
  opened jsonb;
  session_id_value uuid;
  record_value public.shachris_student_records;
  result_value jsonb;
begin
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  session_id_value := (opened->'session'->>'id')::uuid;
  perform public.shachris_start_session(session_id_value, 'QA');
  update public.shachris_sessions set started_at = clock_timestamp() - interval '8 minutes', milestone_times = jsonb_build_object('hodu', clock_timestamp() - interval '8 minutes') where id = session_id_value;

  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  perform public.shachris_update_daily_fact(session_id_value, 1, 'nonattendance', '{"status":"excused"}', 'QA', record_value.revision);
  perform public.shachris_bulk_arrive_at_start(session_id_value, array[1]::bigint[], 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if record_value.presence <> 'absent' or record_value.absence_status <> 'excused' or record_value.arrival_at is not null then raise exception 'Bulk arrival overwrote excused nonattendance'; end if;
  perform public.shachris_record_presence_event(session_id_value, 1, 'arrival', null, 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if record_value.absence_status is not null or record_value.late_minutes <> 8 or record_value.late_reason <> 'no_reason' then raise exception 'Arrival facts not stored independently'; end if;
  perform public.shachris_update_daily_fact(session_id_value, 1, 'late-reason', '{"reason":"transportation","excused":true,"note":""}', 'QA', record_value.revision);
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if not record_value.late_excused or record_value.late_minutes <> 8 then raise exception 'Excusal erased lateness'; end if;

  begin
    perform public.shachris_update_daily_fact(session_id_value, 1, 'personal-clearance', '{}', 'QA', record_value.revision);
    raise exception 'Expected premature clearance denial';
  exception when others then
    if sqlerrm = 'Expected premature clearance denial' then raise; end if;
  end;
  result_value := public.shachris_mark_milestone(session_id_value, 'shemoneh-esrei', 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if record_value.personally_cleared_at is not null or record_value.requirement_result <> 'pending' or (result_value->>'metCount')::integer <> 0 then raise exception 'Communal milestone cleared an individual'; end if;
  perform public.shachris_record_presence_event(session_id_value, 1, 'left', 'with', 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  begin
    perform public.shachris_update_daily_fact(session_id_value, 1, 'personal-clearance', '{}', 'QA', record_value.revision);
    raise exception 'Expected out-student clearance denial';
  exception when others then
    if sqlerrm = 'Expected out-student clearance denial' then raise; end if;
  end;
  perform public.shachris_record_presence_event(session_id_value, 1, 'returned', null, 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  perform public.shachris_update_daily_fact(session_id_value, 1, 'personal-clearance', '{}', 'QA', record_value.revision);
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if record_value.personally_cleared_at is null or record_value.personally_cleared_by_name <> 'QA' or record_value.personally_cleared_milestone <> 'shemoneh-esrei' or record_value.requirement_result <> 'met' then raise exception 'Personal clearance facts missing'; end if;
  update public.shachris_student_records set extra_stay_intervals = jsonb_build_array(jsonb_build_object('startedAt', clock_timestamp() - interval '2 minutes', 'endedAt', null)) where session_id = session_id_value and student_id = 1;
  perform public.shachris_record_presence_event(session_id_value, 1, 'left', 'without', 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if not record_value.stayed_beyond_required or record_value.extra_stay_intervals->0->>'endedAt' is null or record_value.requirement_result <> 'met' then raise exception 'Extra stay/clearance lost on departure'; end if;
  perform public.shachris_record_presence_event(session_id_value, 1, 'returned', null, 'QA');
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;
  if jsonb_array_length(record_value.extra_stay_intervals) <> 2 or jsonb_array_length(record_value.leave_intervals) <> 2 or not (opened->'records'->0->>'late_excused')::boolean then raise exception 'Daily facts did not survive reopen'; end if;

  perform public.shachris_mark_milestone(session_id_value, 'chazaras-hashatz', 'QA');
  perform public.shachris_record_presence_event(session_id_value, 2, 'arrival', null, 'QA');
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 2;
  if record_value.requirement_result <> 'pending' or record_value.personally_cleared_at is not null then raise exception 'Late arrival after required milestone was auto-cleared'; end if;
  perform public.shachris_update_daily_fact(session_id_value, 2, 'personal-clearance', '{}', 'QA', record_value.revision);
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 2;
  if record_value.personally_cleared_at is null or record_value.personally_cleared_milestone <> 'chazaras-hashatz' then raise exception 'Late arrival could not be personally checked'; end if;
  select * into record_value from public.shachris_student_records where session_id = session_id_value and student_id = 1;

  begin
    perform public.shachris_save_records(session_id_value, jsonb_build_array(jsonb_build_object('student_id', 1, 'presence', 'absent', 'said_section_ids', '[]'::jsonb, 'revision', record_value.revision)), 'QA');
    raise exception 'Expected generic presence bypass denial';
  exception when others then
    if sqlerrm = 'Expected generic presence bypass denial' then raise; end if;
  end;
  begin
    perform public.shachris_set_stay_requirement(1, 'manual', 'end-davening', '', 'QA', current_date, session_id_value, record_value.revision, 'today');
    raise exception 'Expected cleared requirement protection';
  exception when others then
    if sqlerrm = 'Expected cleared requirement protection' then raise; end if;
  end;
  begin
    perform public.shachris_update_daily_fact(session_id_value, 1, 'late-reason', '{"reason":"excused"}', 'QA', record_value.revision - 1);
    raise exception 'Expected stale revision denial';
  exception when others then
    if sqlerrm = 'Expected stale revision denial' then raise; end if;
  end;
  perform set_config('test.denied', 'edit', true);
  begin
    perform public.shachris_update_daily_fact(session_id_value, 1, 'late-reason', '{"reason":"excused"}', 'QA', record_value.revision);
    raise exception 'Expected permission denial';
  exception when others then
    if sqlerrm = 'Expected permission denial' then raise; end if;
  end;
  perform set_config('test.denied', '', true);
  if has_function_privilege('anon', 'public.shachris_update_daily_fact(uuid,bigint,text,jsonb,text,integer)', 'execute') or has_table_privilege('anon', 'public.shachris_student_records', 'select') then raise exception 'Anonymous facts exposed'; end if;
  if not exists(select 1 from public.shachris_events where session_id = session_id_value and event_type = 'personal-clearance') or not exists(select 1 from public.shachris_events where session_id = session_id_value and event_type = 'late-reason') or not exists(select 1 from public.shachris_events where session_id = session_id_value and event_type = 'nonattendance') then raise exception 'Daily audit facts missing'; end if;
end $$;
rollback;