\set ON_ERROR_STOP on
do $$
declare
  session_id_value uuid;
  event_number integer;
begin
  update public.students set date_of_birth = (current_date - interval '11 years')::date where id = 1;
  update public.students set date_of_birth = (current_date - interval '12 years')::date where id = 2;
  insert into public.shachris_sessions(session_date, config)
    select current_date, config from public.shachris_settings returning id into session_id_value;
  insert into public.shachris_student_records(session_id, student_id, expectation, presence, said_section_ids, rating_id, note, updated_by_name)
  values
    (session_id_value, 1, '{"milestoneId":"start","label":"Start","sectionIds":["baruch-sheamar"],"source":"default"}', 'present', '["baruch-sheamar"]', 'ni', 'legacy-note-one', 'QA'),
    (session_id_value, 2, '{"milestoneId":"ashrei","label":"Ashrei","sectionIds":["baruch-sheamar","ashrei"],"source":"manual"}', 'left', '["baruch-sheamar","ashrei"]', 'g', 'legacy-note-two', 'QA');
  for event_number in 1..13 loop
    insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
    values(session_id_value, case when event_number % 2 = 0 then 2 else 1 end, 'presence', jsonb_build_object('legacyEvent', event_number), 'QA');
  end loop;
end $$;