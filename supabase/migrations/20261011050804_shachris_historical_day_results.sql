begin;

alter table public.shachris_student_records add column historical_result jsonb
	check (historical_result is null or jsonb_typeof(historical_result) = 'object');

create function public.shachris_save_historical_day(p_date date, p_student_id bigint, p_result jsonb, p_revision integer, p_reason text, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
	session_row public.shachris_sessions;
	record_row public.shachris_student_records;
	before_record jsonb;
	status_value text;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_date is null or p_date >= current_date or extract(dow from p_date) = 6 then raise exception 'Choose a previous school day'; end if;
	if nullif(btrim(p_reason), '') is null or length(p_reason) > 500 or nullif(btrim(p_actor_name), '') is null or length(p_actor_name) > 200 then raise exception 'Provide an edit reason and actor'; end if;
	if not exists(select 1 from public.students student join public.student_class_assignments assignment on assignment.student_id = student.id
		where student.id = p_student_id and student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b')) then raise exception 'Student is not in the active Shachris roster'; end if;
	if p_result is null or jsonb_typeof(p_result) <> 'object' or
		(p_result - 'status' - 'onTime' - 'stayedRequired' - 'lateReason' - 'lateExcused' - 'lateReasonNote' - 'note') <> '{}'::jsonb then raise exception 'Invalid historical result'; end if;
	status_value := p_result->>'status';
	if status_value is null or status_value not in ('present', 'absent', 'excused', 'not_in_shul')
		or jsonb_typeof(p_result->'lateExcused') is distinct from 'boolean'
		or jsonb_typeof(p_result->'note') is distinct from 'string' or length(p_result->>'note') > 2000
		or jsonb_typeof(p_result->'lateReasonNote') is distinct from 'string' or length(p_result->>'lateReasonNote') > 500
		or coalesce(p_result->>'lateReason', '') not in ('transportation', 'excused', 'no_reason', 'other') then raise exception 'Invalid historical fields'; end if;
	if status_value = 'present' then
		if jsonb_typeof(p_result->'onTime') is distinct from 'boolean' or jsonb_typeof(p_result->'stayedRequired') is distinct from 'boolean' then raise exception 'Choose arrival and required-stay results'; end if;
		if (p_result->>'onTime')::boolean and (p_result->>'lateExcused')::boolean then raise exception 'On Time cannot have excused lateness'; end if;
		if not (p_result->>'onTime')::boolean and ((p_result->>'lateReason' = 'excused' and not (p_result->>'lateExcused')::boolean)
			or (p_result->>'lateReason' = 'no_reason' and (p_result->>'lateExcused')::boolean)) then raise exception 'Late reason and excusal disagree'; end if;
	elsif p_result->'onTime' is distinct from 'null'::jsonb or p_result->'stayedRequired' is distinct from 'null'::jsonb or (p_result->>'lateExcused')::boolean then
		raise exception 'Nonattendance cannot have arrival or stay results';
	end if;
	select * into session_row from public.shachris_sessions where session_date = p_date for update;
	if session_row.id is null then
		if p_revision is not null then raise exception 'Day changed. Reload before saving.'; end if;
		insert into public.shachris_sessions(session_date, config) select p_date, config from public.shachris_settings where id = true
			on conflict (session_date) do nothing;
		select * into session_row from public.shachris_sessions where session_date = p_date for update;
	end if;
	if session_row.id is null then raise exception 'Shachris settings missing'; end if;
	select * into record_row from public.shachris_student_records where session_id = session_row.id and student_id = p_student_id for update;
	if record_row.student_id is null then
		if p_revision is not null then raise exception 'Day changed. Reload before saving.'; end if;
		insert into public.shachris_student_records(session_id, student_id, expectation, stay_requirement)
			values(session_row.id, p_student_id, public.shachris_resolve_expectation(p_student_id, p_date, session_row.config), public.shachris_resolve_stay_requirement(p_student_id, p_date, session_row.config))
			returning * into record_row;
		before_record := null;
	else
		if record_row.revision is distinct from p_revision then raise exception 'Day changed. Reload before saving.'; end if;
		before_record := to_jsonb(record_row);
	end if;
	update public.shachris_student_records set historical_result = p_result, revision = revision + 1,
		updated_by = auth.uid(), updated_by_name = btrim(p_actor_name), updated_at = clock_timestamp()
		where session_id = session_row.id and student_id = p_student_id returning * into record_row;
	insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		values(session_row.id, p_student_id, 'historical-day-edit', jsonb_build_object('reason', btrim(p_reason), 'before', before_record, 'after', to_jsonb(record_row)), btrim(p_actor_name));
	return jsonb_build_object('session', to_jsonb(session_row), 'record', to_jsonb(record_row));
end $$;

revoke all on function public.shachris_save_historical_day(date, bigint, jsonb, integer, text, text) from public, anon, authenticated;
grant execute on function public.shachris_save_historical_day(date, bigint, jsonb, integer, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
