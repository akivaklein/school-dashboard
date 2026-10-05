\set ON_ERROR_STOP on
begin;
do $$
declare
  opened jsonb;
  session_id_value uuid;
  result jsonb;
  config_value jsonb;
  saved_config jsonb;
  legacy_title text;
begin
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  session_id_value := (opened->'session'->>'id')::uuid;
  if jsonb_array_length(opened->'records') <> 2 then raise exception 'Roster was not created'; end if;
  result := public.shachris_set_expectation(2, 'manual', 'full', null, 'Advance', 'QA', current_date, session_id_value, 0, 'future');
  if jsonb_array_length(result->'record'->'expectation'->'sectionIds') <> 4 then raise exception 'Manual expectation did not apply'; end if;
  result := public.shachris_save_records(session_id_value, jsonb_build_array(
    jsonb_build_object('student_id', 1, 'presence', 'present', 'said_section_ids', jsonb_build_array('baruch-sheamar'), 'rating_id', 'ni', 'revision', 0),
    jsonb_build_object('student_id', 2, 'presence', 'absent', 'said_section_ids', jsonb_build_array('baruch-sheamar','ashrei','shema','shemoneh-esrei'), 'rating_id', '', 'revision', 1)
  ), 'QA');
  if result->0->>'presence' <> 'present' or result->1->>'presence' <> 'absent' or result->0->>'rating_id' <> 'ni' then raise exception 'Independent values changed'; end if;
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  if jsonb_array_length(opened->'records'->1->'said_section_ids') <> 4 then raise exception 'Refresh persistence failed'; end if;
  begin
    perform public.shachris_save_records(session_id_value, jsonb_build_array(jsonb_build_object('student_id', 1, 'presence', 'left', 'said_section_ids', '[]'::jsonb)), 'QA');
    raise exception 'Missing revision was accepted';
  exception when others then
    if sqlerrm not like 'Another staff member%' then raise; end if;
  end;
  begin
    perform public.shachris_save_records(session_id_value, jsonb_build_array(jsonb_build_object('student_id', 1, 'presence', 'left', 'said_section_ids', '[]'::jsonb, 'revision', 0)), 'QA');
    raise exception 'Stale save was accepted';
  exception when others then
    if sqlerrm not like 'Another staff member%' then raise; end if;
  end;
  begin
    perform public.shachris_save_records(session_id_value, jsonb_build_array(
      jsonb_build_object('student_id', 1, 'presence', 'left', 'said_section_ids', '[]'::jsonb, 'revision', 1),
      jsonb_build_object('student_id', 2, 'presence', 'left', 'said_section_ids', '[]'::jsonb, 'revision', 0)
    ), 'QA');
    raise exception 'Stale bulk save was accepted';
  exception when others then
    if sqlerrm not like 'Another staff member%' then raise; end if;
  end;
  if (select presence from public.shachris_student_records where session_id = session_id_value and student_id = 1) <> 'present' then raise exception 'Bulk save was not atomic'; end if;
  perform public.shachris_open_session(current_date - 1, array[1,2]::bigint[]);
  result := public.shachris_set_expectation(2, 'manual', 'ashrei', null, 'Lower', 'QA', current_date, session_id_value, 2, 'future');
  if (select expectation->>'milestoneId' from public.shachris_student_records record join public.shachris_sessions session on session.id = record.session_id where session.session_date = current_date - 1 and record.student_id = 2) <> 'start' then raise exception 'Past expectation changed'; end if;
  if (select count(*) from public.shachris_expectations where student_id = 2) <> 2 then raise exception 'Progression history lost'; end if;
  select config into config_value from public.shachris_settings;
  config_value := jsonb_set(config_value, '{rules}', '[{"id":"eighth","grade":"8","milestoneId":"full"},{"id":"seventh","grade":"7","milestoneId":"shema"}]');
  saved_config := public.shachris_save_settings(config_value, 0);
  update public.students set date_of_birth = (current_date - interval '13 years')::date where id in (1,2);
  if public.shachris_resolve_expectation(1, current_date + 1, saved_config->'config')->>'milestoneId' <> 'full' then raise exception 'Authoritative grade default did not apply'; end if;
  update public.students set date_of_birth = (current_date - interval '7 years')::date where id = 1;
  if public.shachris_resolve_expectation(1, current_date + 1, saved_config->'config')->>'milestoneId' <> 'full' then raise exception 'DOB changed the grade default'; end if;
  update public.student_class_assignments set class_id = 'yk-b' where student_id = 1;
  if public.shachris_resolve_expectation(1, current_date + 1, saved_config->'config')->>'milestoneId' <> 'shema' then raise exception 'Primary seventh grade assignment was ignored'; end if;
  update public.student_class_assignments set class_id = 'gemara-level-8' where student_id = 1;
  if public.shachris_resolve_expectation(1, current_date + 1, saved_config->'config')->>'milestoneId' <> 'start' then raise exception 'Instructional level was treated as actual grade'; end if;
  update public.student_class_assignments set class_id = 'yk-a' where student_id = 1;
  begin
    perform public.shachris_save_settings(jsonb_set(config_value, '{rules}', '[{"id":"age","grade":"8","minAge":12,"milestoneId":"full"}]'), 1);
    raise exception 'Age-based rule was accepted';
  exception when others then
    if sqlerrm not like 'Defaults must use one rule%' then raise; end if;
  end;
  if public.shachris_resolve_expectation(2, current_date + 1, saved_config->'config')->>'milestoneId' <> 'ashrei' then raise exception 'Default replaced manual expectation'; end if;
  result := public.shachris_set_expectation(2, 'manual', 'full', null, 'Temporary', 'QA', current_date, session_id_value, 3, 'today');
  if result->'record'->'expectation'->>'milestoneId' <> 'full' or result->'record'->'expectation'->>'duration' <> 'today' then raise exception 'Today-only expectation did not apply'; end if;
  opened := public.shachris_open_session(current_date, array[1,2]::bigint[]);
  if opened->'records'->1->'expectation'->>'milestoneId' <> 'full' then raise exception 'Today-only expectation did not survive refresh'; end if;
  if public.shachris_resolve_expectation(2, current_date + 1, saved_config->'config')->>'milestoneId' <> 'ashrei' then raise exception 'Today-only change replaced the future expectation'; end if;
  result := public.shachris_set_expectation(2, 'default', null, null, 'Temporary default', 'QA', current_date, session_id_value, 4, 'today');
  if result->'record'->'expectation'->>'source' <> 'default' or public.shachris_resolve_expectation(2, current_date + 1, saved_config->'config')->>'milestoneId' <> 'ashrei' then raise exception 'Temporary default erased the continuing override'; end if;
  if (select count(*) from public.shachris_expectations where student_id = 2 and duration = 'today') <> 2 then raise exception 'Temporary progression history was lost'; end if;
  result := public.shachris_set_expectation(2, 'default', null, null, 'Default', 'QA', current_date, session_id_value, 5, 'future');
  if result->'record'->'expectation'->>'source' <> 'default' then raise exception 'Return to default failed'; end if;
  if public.shachris_resolve_expectation(2, current_date + 1, saved_config->'config')->>'source' <> 'default' then raise exception 'Continuing default did not apply tomorrow'; end if;
  perform set_config('test.denied', 'edit', true);
  begin
    perform public.shachris_save_records(session_id_value, '[]'::jsonb, 'QA');
    raise exception 'Denied edit accepted';
  exception when others then
    if sqlerrm <> 'Shachris editing denied' then raise; end if;
  end;
  perform set_config('test.denied', '', true);
  select title into legacy_title from public.davening_checklists where id = 1;
  if legacy_title <> 'Existing legacy checklist' then raise exception 'Legacy data changed'; end if;
  raise notice 'PASS: SQL persistence, independent marks, manual priority, progression, snapshots, stale/atomic saves, permissions, and legacy preservation';
end $$;
rollback;