\set ON_ERROR_STOP on
begin;
do $$
declare
  opened jsonb;
  started jsonb;
  changed jsonb;
  evaluated jsonb;
  session_id_value uuid;
  start_time timestamptz;
  record_value jsonb;
  session_value jsonb;
begin
  update public.students set date_of_birth = (current_date - interval '11 years')::date where id = 1;
  update public.students set date_of_birth = (current_date - interval '12 years')::date where id = 2;
  insert into public.students(id, name, is_active, date_of_birth) values
    (4, 'QA Age Thirteen', true, (current_date - interval '13 years')::date),
    (5, 'QA Today Override', true, (current_date - interval '11 years')::date);
  insert into public.student_class_assignments(student_id, class_id) values (4, 'yk-a'), (5, 'yk-b');

  opened := public.shachris_open_session(current_date, array[1,2,4,5]::bigint[]);
  session_id_value := (opened->'session'->>'id')::uuid;
  if (select stay_requirement->>'requiredUntil' from public.shachris_student_records where session_id = session_id_value and student_id = 1) <> 'shemoneh-esrei'
    or (select stay_requirement->>'requiredUntil' from public.shachris_student_records where session_id = session_id_value and student_id = 2) <> 'chazaras-hashatz'
    or (select stay_requirement->>'requiredUntil' from public.shachris_student_records where session_id = session_id_value and student_id = 4) <> 'end-davening' then
    raise exception 'Age 11/12/13 stay defaults are incorrect';
  end if;

  started := public.shachris_start_session(session_id_value, 'QA Rebbe');
  start_time := (started->>'started_at')::timestamptz;
  if started->'milestone_times'->>'hodu' is null then raise exception 'Hodu baseline was not recorded'; end if;
  update public.shachris_sessions set started_at = clock_timestamp() - interval '10 minutes',
    milestone_times = jsonb_set(milestone_times, '{hodu}', to_jsonb(clock_timestamp() - interval '10 minutes'), true)
    where id = session_id_value returning started_at into start_time;
  perform public.shachris_bulk_arrive_at_start(session_id_value, array[1,4,5]::bigint[], 'QA Rebbe');
  changed := public.shachris_record_presence_event(session_id_value, 2, 'arrival', null, 'QA Rebbe');
  if changed->>'arrival_at' is null or (select (detail->>'minutesLate')::integer from public.shachris_events where session_id = session_id_value and student_id = 2 and event_type = 'arrival') < 9 then
    raise exception 'Later arrival timestamp or lateness was not recorded';
  end if;

  perform public.shachris_record_presence_event(session_id_value, 1, 'left', 'with', 'QA Rebbe');
  perform public.shachris_record_presence_event(session_id_value, 1, 'returned', null, 'QA Rebbe');
  perform public.shachris_record_presence_event(session_id_value, 1, 'left', 'without', 'QA Rebbe');
  perform public.shachris_record_presence_event(session_id_value, 1, 'returned', null, 'QA Rebbe');
  record_value := (select to_jsonb(record) from public.shachris_student_records record where session_id = session_id_value and student_id = 1);
  if jsonb_array_length(record_value->'leave_intervals') <> 2 or record_value->'leave_intervals'->0->>'permission' <> 'with'
    or record_value->'leave_intervals'->1->>'permission' <> 'without' or record_value->'leave_intervals'->1->>'returnedAt' is null then
    raise exception 'Multiple permission-tagged leave/return intervals were not retained';
  end if;

  changed := public.shachris_set_stay_requirement(5, 'manual', 'end-davening', 'Temporary', 'QA Rebbe', current_date, session_id_value, 1, 'today');
  if changed->'record'->'stay_requirement'->>'duration' <> 'today' then raise exception 'Today-only manual requirement did not apply'; end if;

  evaluated := public.shachris_mark_milestone(session_id_value, 'shemoneh-esrei', 'QA Rebbe');
  if (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 1) <> 'met'
    or (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 2) <> 'pending'
    or (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 5) <> 'pending' then
    raise exception 'Shemoneh Esrei evaluated the wrong age requirements';
  end if;
  perform public.shachris_record_presence_event(session_id_value, 1, 'left', 'with', 'QA Rebbe');
  if (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 1) <> 'met' then
    raise exception 'Departure after the required milestone undid a met result';
  end if;

  perform public.shachris_record_presence_event(session_id_value, 2, 'left', 'with', 'QA Rebbe');
  perform public.shachris_record_presence_event(session_id_value, 2, 'returned', null, 'QA Rebbe');
  perform public.shachris_record_presence_event(session_id_value, 4, 'left', 'without', 'QA Rebbe');
  perform public.shachris_mark_milestone(session_id_value, 'chazaras-hashatz', 'QA Rebbe');
  if (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 2) <> 'met'
    or (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 4) <> 'pending' then
    raise exception 'Chazaras HaShatz automatic evaluation failed';
  end if;
  evaluated := public.shachris_mark_milestone(session_id_value, 'end-davening', 'QA Rebbe');
  if (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 4) <> 'not_met'
    or (select requirement_result from public.shachris_student_records where session_id = session_id_value and student_id = 5) <> 'met' then
    raise exception 'End Davening automatic evaluation failed';
  end if;
  if evaluated->>'metCount' <> '1' or evaluated->>'notMetCount' <> '1' then raise exception 'Milestone result counts are incorrect'; end if;

  session_value := public.shachris_open_session(current_date + 1, array[5]::bigint[])->'session';
  if (select stay_requirement->>'requiredUntil' from public.shachris_student_records where session_id = (session_value->>'id')::uuid and student_id = 5) <> 'shemoneh-esrei' then
    raise exception 'Today-only override leaked into tomorrow instead of returning to the age default';
  end if;
  raise notice 'PASS: Hodu baseline, bulk baseline arrival, late arrival, repeated leave/return, permission, age defaults, today override, milestone auto-result and irreversible Met status';
end $$;
rollback;