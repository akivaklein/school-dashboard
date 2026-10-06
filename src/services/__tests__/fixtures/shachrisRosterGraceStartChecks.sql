\set ON_ERROR_STOP on
begin;
create or replace function public.dashboard_is_admin() returns boolean language sql stable as $$ select false $$;
insert into public.students(id, name, is_active) values (4, 'QA Outside Grade', true), (5, 'QA No Assignment', true);
insert into public.student_class_assignments(student_id, class_id) values (3, 'yk-a'), (4, 'math');
do $$
declare
  opened jsonb;
  started jsonb;
  session_id_value uuid;
  start_value timestamptz;
  first_arrival timestamptz;
  original_events integer;
  detail_value jsonb;
begin
  if public.dashboard_is_admin() then raise exception 'Fixture must represent a nonadmin editor'; end if;
  opened := public.shachris_open_session(current_date, array[1,2,3,4,5]::bigint[]);
  if jsonb_array_length(opened->'records') <> 2 then raise exception 'Roster admitted archived/out-of-grade/unassigned students'; end if;
  session_id_value := (opened->'session'->>'id')::uuid;
  started := public.shachris_start_session(session_id_value, 'Teacher');
  start_value := (started->>'started_at')::timestamptz;
  if (started->'config'->>'arrivalGraceMinutes')::integer <> 2 then raise exception 'New start did not snapshot two-minute grace'; end if;
  if (public.shachris_start_correction_state(session_id_value)->>'hasActivity')::boolean then raise exception 'Start audit must not block empty reset'; end if;
  perform public.shachris_correct_start(session_id_value, 'reset', null, start_value, 'Accidental click', 'Teacher', true);
  if exists(select 1 from public.shachris_sessions where id=session_id_value and started_at is not null) then raise exception 'Nonadmin editor could not reset empty start'; end if;
  if (select count(*) from public.shachris_start_audit where session_id=session_id_value) <> 2 then raise exception 'Start/reset audit missing'; end if;

  started := public.shachris_start_session(session_id_value, 'Teacher');
  start_value := (started->>'started_at')::timestamptz;
  detail_value := public.shachris_record_presence_event(session_id_value, 1, 'arrival', null, 'Teacher');
  first_arrival := (detail_value->>'arrival_at')::timestamptz;
  if (detail_value->>'late_minutes')::integer <> 0 or detail_value->>'late_reason' is not null then raise exception 'Within-grace arrival treated as late'; end if;
  begin
    perform public.shachris_update_daily_fact(session_id_value, 1, 'late-reason', '{"reason":"excused"}', 'Teacher', (detail_value->>'revision')::integer);
    raise exception 'Expected within-grace late-reason denial';
  exception when others then
    if sqlerrm = 'Expected within-grace late-reason denial' then raise; end if;
  end;
  begin
    perform public.shachris_correct_start(session_id_value, 'reset', null, start_value, 'Testing', 'Teacher', true);
    raise exception 'Expected reset activity denial';
  exception when others then
    if sqlerrm = 'Expected reset activity denial' then raise; end if;
  end;
  begin
    perform public.shachris_correct_start(session_id_value, 'correct', start_value - interval '8 minutes', start_value, 'Testing', 'Teacher', false);
    raise exception 'Expected confirmation denial';
  exception when others then
    if sqlerrm = 'Expected confirmation denial' then raise; end if;
  end;
  select count(*) into original_events from public.shachris_events where session_id=session_id_value;
  perform public.shachris_correct_start(session_id_value, 'correct', start_value - interval '8 minutes', start_value, 'Correct accidental early click', 'Teacher', true);
  if (select arrival_at from public.shachris_student_records where session_id=session_id_value and student_id=1) is distinct from first_arrival then raise exception 'Correction changed factual arrival time'; end if;
  if (select late_minutes from public.shachris_student_records where session_id=session_id_value and student_id=1) <> 8 then raise exception 'Correction did not recalculate factual lateness'; end if;
  if (select count(*) from public.shachris_events where session_id=session_id_value) <> original_events then raise exception 'Correction erased attendance events'; end if;
  if not exists(select 1 from public.shachris_start_audit where session_id=session_id_value and action='corrected' and previous_start=start_value and new_start=start_value-interval '8 minutes' and reason <> '' and detail ? 'previousArrivals') then raise exception 'Correction audit incomplete'; end if;
  perform public.shachris_bulk_arrive_at_start(session_id_value, array[2]::bigint[], 'Teacher');
  if (select arrival_at from public.shachris_student_records where session_id=session_id_value and student_id=2) <> start_value-interval '8 minutes' then raise exception 'Bulk arrival lost exact Hodu timestamp'; end if;

  perform set_config('test.denied','edit',true);
  begin
    perform public.shachris_start_correction_state(session_id_value);
    raise exception 'Expected view-only correction denial';
  exception when others then
    if sqlerrm = 'Expected view-only correction denial' then raise; end if;
  end;
  begin
    perform public.shachris_correct_start(session_id_value, 'correct', start_value, start_value-interval '8 minutes', 'Test', 'Viewer', true);
    raise exception 'Expected view-only write denial';
  exception when others then
    if sqlerrm = 'Expected view-only write denial' then raise; end if;
  end;
  perform set_config('test.denied','',true);
  if has_function_privilege('anon','public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean)','execute') or has_table_privilege('anon','public.shachris_start_audit','select') then raise exception 'Anonymous correction/history exposed'; end if;
end $$;
rollback;