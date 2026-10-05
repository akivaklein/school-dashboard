\set ON_ERROR_STOP on
begin;
do $$
declare
  opened jsonb;
  session_id_value uuid;
  started jsonb;
begin
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  session_id_value := (opened->'session'->>'id')::uuid;
  if jsonb_array_length(opened->'records') <> 2 then raise exception 'Legacy roster records disappeared'; end if;
  if opened->'records'->0->'stay_requirement'->>'requiredUntil' is null or opened->'records'->1->'stay_requirement'->>'requiredUntil' is null then raise exception 'Current unstarted session did not receive stay requirement snapshots'; end if;
  if opened->'session'->'config'->'stayRules' is null or opened->'session'->'config'->'sections' is null then raise exception 'Session configuration merge removed existing settings'; end if;
  if opened->'records'->0->>'presence' <> 'present' or opened->'records'->1->>'presence' <> 'left' then raise exception 'Existing presence values changed'; end if;
  if opened->'records'->0->'said_section_ids' <> '["baruch-sheamar"]'::jsonb or opened->'records'->1->'said_section_ids' <> '["baruch-sheamar", "ashrei"]'::jsonb then raise exception 'Existing section marks changed'; end if;
  if opened->'records'->0->>'rating_id' <> 'ni' or opened->'records'->1->>'rating_id' <> 'g' or opened->'records'->0->>'note' <> 'legacy-note-one' or opened->'records'->1->>'note' <> 'legacy-note-two' then raise exception 'Existing rating or note changed'; end if;
  if (select count(*) from public.shachris_events where session_id = session_id_value) <> 13 then raise exception 'Legacy event history changed'; end if;
  started := public.shachris_start_session(session_id_value, 'QA');
  if started->>'started_at' is null then raise exception 'Hodu did not start the preserved session'; end if;
  perform public.shachris_bulk_arrive_at_start(session_id_value, array[1,2]::bigint[], 'QA');
  if (select presence from public.shachris_student_records where session_id = session_id_value and student_id = 2) <> 'left' then raise exception 'Hodu bulk arrival overwrote an already-open leave'; end if;
  if (select arrival_at from public.shachris_student_records where session_id = session_id_value and student_id = 1) <> (started->>'started_at')::timestamptz then raise exception 'Hodu bulk arrival did not use the session baseline'; end if;
  raise notice 'PASS: existing current session, sections, ratings, notes, presence, and 13 events preserved; new requirements added without resetting an open leave';
end $$;
rollback;