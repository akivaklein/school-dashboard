\set ON_ERROR_STOP on
begin;
set local plpgsql.variable_conflict = 'use_variable';

create function pg_temp.expect_undo_denied(session_id uuid, revision integer, expected text, confirmed boolean default true, reason text default 'Accidental tap')
returns void language plpgsql as $$
declare before_records jsonb; before_events jsonb;
begin
  select jsonb_agg(to_jsonb(r) order by student_id) into before_records from public.shachris_student_records r where r.session_id = expect_undo_denied.session_id;
  select jsonb_agg(to_jsonb(e) order by id) into before_events from public.shachris_events e where e.session_id = expect_undo_denied.session_id;
  begin
    perform public.shachris_undo_arrival(session_id, 1, revision, reason, 'Editor', confirmed);
    raise exception 'Unsafe undo accepted';
  exception when raise_exception then if sqlerrm <> expected then raise; end if; end;
  if (select jsonb_agg(to_jsonb(r) order by student_id) from public.shachris_student_records r where r.session_id = expect_undo_denied.session_id) is distinct from before_records
    or (select jsonb_agg(to_jsonb(e) order by id) from public.shachris_events e where e.session_id = expect_undo_denied.session_id) is distinct from before_events then
    raise exception 'Denied correction modified records/events';
  end if;
end $$;

do $$
declare
  session_id uuid;
  revision integer;
  corrected jsonb;
  original_events jsonb;
  before_record jsonb;
  expected_status text;
begin
  if has_function_privilege('anon', 'public.shachris_undo_arrival(uuid,bigint,integer,text,text,boolean)', 'execute')
    or not has_function_privilege('authenticated', 'public.shachris_undo_arrival(uuid,bigint,integer,text,text,boolean)', 'execute') then
    raise exception 'Undo privileges incorrect';
  end if;
  session_id := (public.shachris_open_session(current_date, array[1,2]::bigint[])->'session'->>'id')::uuid;
  perform public.shachris_start_session(session_id, 'Editor');
  perform public.shachris_bulk_arrive_at_start(session_id, array[1]::bigint[], 'Editor');
  update public.shachris_student_records r set note = 'Unrelated note', said_section_ids = '["baruch-sheamar"]', rating_id = 'vg'
    where r.session_id = session_id and student_id = 1;
  select r.revision, to_jsonb(r) into revision, before_record from public.shachris_student_records r where r.session_id = session_id and student_id = 1;
  select jsonb_agg(to_jsonb(e) order by id) into original_events from public.shachris_events e where e.session_id = session_id;
  perform pg_temp.expect_undo_denied(session_id, revision, 'Confirm Undo Arrival and provide a reason and actor', false);
  perform pg_temp.expect_undo_denied(session_id, revision, 'Confirm Undo Arrival and provide a reason and actor', true, ' ');
  perform pg_temp.expect_undo_denied(session_id, revision - 1, 'Session changed. Reload before correcting arrival.');
  perform set_config('test.denied', 'edit', true);
  perform pg_temp.expect_undo_denied(session_id, revision, 'Shachris editing denied');
  perform set_config('test.denied', '', true);
  execute 'create or replace function auth.uid() returns uuid language sql stable as $auth$ select null::uuid $auth$';
  perform pg_temp.expect_undo_denied(session_id, revision, 'Shachris editing denied');
  execute 'create or replace function auth.uid() returns uuid language sql stable as $auth$ select ''00000000-0000-0000-0000-000000000001''::uuid $auth$';
  corrected := public.shachris_undo_arrival(session_id, 1, revision, ' Accidental bulk tap ', 'Editor', true);
  if corrected->>'presence' <> 'unmarked' or corrected->'arrival_at' <> 'null'::jsonb or corrected->'absence_status' <> 'null'::jsonb
    or corrected->'late_minutes' <> 'null'::jsonb or corrected->'late_reason' <> 'null'::jsonb or corrected->>'late_excused' <> 'false'
    or corrected->>'note' <> 'Unrelated note' or corrected->'said_section_ids' <> '["baruch-sheamar"]'::jsonb or corrected->>'rating_id' <> 'vg'
    or (corrected->>'revision')::integer <> revision + 1 then raise exception 'Bulk undo did not restore correct state/preserve notes'; end if;
  if (select jsonb_agg(to_jsonb(e) order by id) from public.shachris_events e where e.session_id = session_id and event_type <> 'arrival-correction') <> original_events then
    raise exception 'Original events changed';
  end if;
  if not exists (select 1 from public.shachris_events e where e.session_id = session_id and event_type = 'arrival-correction'
    and detail->>'reason' = 'Accidental bulk tap' and detail->'before' = before_record and detail->'after' = corrected
    and detail->>'action' = 'undo-arrival' and detail ? 'arrivalEventId' and actor_name = 'Editor' and created_by = auth.uid()) then
    raise exception 'Undo audit missing';
  end if;
  perform pg_temp.expect_undo_denied(session_id, revision + 1, 'Student does not have an arrival to undo');
  for expected_status in select unnest(array['absent', 'excused', 'not_in_shul', 'unmarked']) loop
    select r.revision into revision from public.shachris_student_records r where r.session_id = session_id and student_id = 1;
    perform public.shachris_update_daily_fact(session_id, 1, 'nonattendance', jsonb_build_object('status', expected_status), 'Editor', revision);
    perform public.shachris_record_presence_event(session_id, 1, 'arrival', null, 'Editor');
    select r.revision into revision from public.shachris_student_records r where r.session_id = session_id and student_id = 1;
    corrected := public.shachris_undo_arrival(session_id, 1, revision, 'Accidental arrival', 'Editor', true);
    if corrected->>'presence' <> (case when expected_status = 'unmarked' then 'unmarked' else 'absent' end)
      or corrected->>'absence_status' is distinct from (case when expected_status = 'unmarked' then null else expected_status end) then
      raise exception 'Wrong pre-arrival status restored: %', expected_status;
    end if;
  end loop;
  perform public.shachris_record_presence_event(session_id, 1, 'arrival', null, 'Editor');
  perform public.shachris_record_presence_event(session_id, 1, 'left', 'without', 'Editor');
  perform public.shachris_record_presence_event(session_id, 1, 'returned', null, 'Editor');
  select r.revision into revision from public.shachris_student_records r where r.session_id = session_id and student_id = 1;
  perform pg_temp.expect_undo_denied(session_id, revision, 'Later attendance/completion facts exist. Use deliberate correction/history editing; Undo Arrival will not remove them.');
  update public.shachris_student_records r set leave_intervals = '[]', last_return_at = null, personally_cleared_at = clock_timestamp()
    where r.session_id = session_id and student_id = 1;
  perform pg_temp.expect_undo_denied(session_id, revision, 'Later attendance/completion facts exist. Use deliberate correction/history editing; Undo Arrival will not remove them.');
  update public.shachris_student_records r set personally_cleared_at = null,
    historical_result = '{"status":"present","onTime":true,"stayedRequired":true,"lateReason":"no_reason","lateExcused":false,"lateReasonNote":"","note":"Kept edit"}'
    where r.session_id = session_id and student_id = 1;
  perform pg_temp.expect_undo_denied(session_id, revision, 'Later attendance/completion facts exist. Use deliberate correction/history editing; Undo Arrival will not remove them.');
  update public.shachris_student_records r set historical_result = null, arrival_at = arrival_at - interval '1 second'
    where r.session_id = session_id and student_id = 1;
  perform pg_temp.expect_undo_denied(session_id, revision, 'Original arrival audit not found. Use deliberate correction/history editing.');
  update public.shachris_student_records r set arrival_at = arrival_at + interval '1 second' where r.session_id = session_id and student_id = 1;
  update public.shachris_events e set detail = detail - 'previousAbsenceStatus' where e.session_id = session_id and student_id = 1 and event_type = 'arrival';
  perform pg_temp.expect_undo_denied(session_id, revision, 'Pre-arrival status is not recorded. Use deliberate correction/history editing.');
  perform public.shachris_end_live_session(session_id, 'Editor');
  perform pg_temp.expect_undo_denied(session_id, revision, 'Live session ended. Use deliberate correction/history editing.');
  perform public.shachris_correct_start(session_id, 'restart', null,
    (select started_at from public.shachris_sessions s where s.id = session_id), 'Test replacement', 'Editor', true);
  perform pg_temp.expect_undo_denied(session_id, revision, 'Undo Arrival requires today active Hodu session');
end $$;

rollback;
