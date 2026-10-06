begin;

create table public.shachris_start_audit (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null references public.shachris_sessions(id) on delete restrict,
	action text not null check (action in ('started', 'reset', 'corrected')),
	previous_start timestamptz,
	new_start timestamptz,
	reason text not null default '',
	detail jsonb not null default '{}'::jsonb,
	actor_name text not null,
	created_by uuid not null default auth.uid() references auth.users(id),
	created_at timestamptz not null default clock_timestamp()
);
create index shachris_start_audit_session_idx on public.shachris_start_audit(session_id, created_at);
alter table public.shachris_start_audit enable row level security;
revoke all on public.shachris_start_audit from anon, authenticated;
grant select on public.shachris_start_audit to authenticated;
create policy shachris_start_audit_read on public.shachris_start_audit for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));

update public.shachris_settings set config = config || '{"arrivalGraceMinutes":2}'::jsonb, revision = revision + 1 where not config ? 'arrivalGraceMinutes';
update public.shachris_sessions set config = config || jsonb_build_object('arrivalGraceMinutes', case when started_at is null then 2 else 0 end) where not config ? 'arrivalGraceMinutes';

create or replace function public.shachris_open_session(p_date date, p_student_ids bigint[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	student_id_value bigint;
	eligible_ids bigint[];
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'view') then raise exception 'Shachris access denied'; end if;
	select coalesce(array_agg(student.id order by student.id), '{}'::bigint[]) into eligible_ids
		from public.students student join public.student_class_assignments assignment on assignment.student_id = student.id
		where student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b') and student.id = any(p_student_ids);
	select * into session_row from public.shachris_sessions where session_date = p_date;
	if public.dashboard_has_permission('attendance', 'edit') then
		if session_row.id is null then
			insert into public.shachris_sessions(session_date, config) select p_date, config from public.shachris_settings on conflict (session_date) do nothing;
			select * into session_row from public.shachris_sessions where session_date = p_date;
		end if;
		foreach student_id_value in array eligible_ids loop
			insert into public.shachris_student_records(session_id, student_id, expectation, stay_requirement)
				values(session_row.id, student_id_value, public.shachris_resolve_expectation(student_id_value, p_date, session_row.config), public.shachris_resolve_stay_requirement(student_id_value, p_date, session_row.config))
				on conflict (session_id, student_id) do nothing;
		end loop;
	end if;
	if session_row.id is null then raise exception 'No session exists on this date. An editor must open it first.'; end if;
	return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record where record.session_id = session_row.id and record.student_id = any(eligible_ids)), '[]'::jsonb));
end $$;

create or replace function public.shachris_start_session(p_session_id uuid, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	started timestamptz := clock_timestamp();
	grace integer;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date then raise exception 'Only today Shachris session can be started'; end if;
	if session_row.started_at is null then
		select coalesce((config->>'arrivalGraceMinutes')::integer, 2) into grace from public.shachris_settings;
		update public.shachris_sessions set started_at = started, started_by_name = p_actor_name,
			config = jsonb_set(config, '{arrivalGraceMinutes}', to_jsonb(grace), true), milestone_times = jsonb_set(milestone_times, '{hodu}', to_jsonb(started), true)
			where id = p_session_id returning * into session_row;
		insert into public.shachris_start_audit(session_id, action, new_start, actor_name, detail) values(p_session_id, 'started', started, p_actor_name, jsonb_build_object('graceMinutes', grace));
	end if;
	return to_jsonb(session_row);
end $$;

create function public.shachris_apply_arrival_grace()
returns trigger language plpgsql set search_path = public as $$
declare
	session_row public.shachris_sessions;
	grace integer;
begin
	select * into session_row from public.shachris_sessions where id = new.session_id;
	grace := coalesce((session_row.config->>'arrivalGraceMinutes')::integer, 0);
	if new.arrival_at is null or session_row.started_at is null then return new; end if;
	if new.arrival_at <= session_row.started_at + make_interval(mins => grace) then
		if new.arrival_at is not distinct from old.arrival_at and (new.late_reason is distinct from old.late_reason or new.late_reason_note is distinct from old.late_reason_note or new.late_excused is distinct from old.late_excused) then raise exception 'Student arrived within the On Time grace period'; end if;
		new.late_minutes := 0;
		if new.arrival_at is distinct from old.arrival_at then new.late_reason := null; new.late_reason_note := ''; new.late_excused := false; end if;
	else
		new.late_minutes := greatest(0, floor(extract(epoch from (new.arrival_at - session_row.started_at)) / 60)::integer);
	end if;
	return new;
end $$;
create trigger shachris_arrival_grace before update of arrival_at, late_reason, late_reason_note, late_excused on public.shachris_student_records for each row execute function public.shachris_apply_arrival_grace();

create function public.shachris_validate_grace()
returns trigger language plpgsql set search_path = public as $$
begin
	if new.config ? 'arrivalGraceMinutes' and (jsonb_typeof(new.config->'arrivalGraceMinutes') <> 'number' or (new.config->>'arrivalGraceMinutes') !~ '^[0-9]+$' or (new.config->>'arrivalGraceMinutes')::numeric > 10) then raise exception 'Arrival grace must be a whole number from 0 to 10 minutes'; end if;
	return new;
end $$;
create trigger shachris_settings_grace before update of config on public.shachris_settings for each row execute function public.shachris_validate_grace();

create function public.shachris_start_has_activity(p_session_id uuid)
returns boolean language sql stable set search_path = public as $$
	select exists(select 1 from public.shachris_events where session_id = p_session_id)
		or exists(select 1 from public.shachris_student_records where session_id = p_session_id and (revision > 0 or presence <> 'unmarked' or arrival_at is not null or said_section_ids <> '[]'::jsonb or rating_id <> '' or note <> '' or personally_cleared_at is not null))
		or exists(select 1 from public.shachris_sessions session, jsonb_each(session.milestone_times) milestone where session.id = p_session_id and milestone.key <> 'hodu');
$$;

create function public.shachris_start_correction_state(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if not exists(select 1 from public.shachris_sessions where id = p_session_id and session_date = current_date) then raise exception 'Only today start can be corrected'; end if;
	return jsonb_build_object('hasActivity', public.shachris_start_has_activity(p_session_id), 'audit', coalesce((select jsonb_agg(to_jsonb(entry) order by entry.created_at desc, entry.id) from public.shachris_start_audit entry where entry.session_id = p_session_id), '[]'::jsonb));
end $$;

create function public.shachris_correct_start(p_session_id uuid, p_mode text, p_new_start timestamptz, p_expected_start timestamptz, p_reason text, p_actor_name text, p_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	previous_start timestamptz;
	grace integer;
	previous_grace integer;
	before_arrivals jsonb;
begin
		if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_mode is null or p_mode not in ('reset', 'correct') or p_confirmed is distinct from true or nullif(btrim(p_reason), '') is null or length(p_reason) > 500 then raise exception 'Confirm the correction and provide a reason'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date or session_row.started_at is null then raise exception 'Only today started session can be corrected'; end if;
	if session_row.started_at is distinct from p_expected_start then raise exception 'Hodu start changed. Reload before correcting.'; end if;
	perform 1 from public.shachris_student_records where session_id = p_session_id order by student_id for update;
	previous_start := session_row.started_at;
	previous_grace := coalesce((session_row.config->>'arrivalGraceMinutes')::integer, 0);
	select coalesce((config->>'arrivalGraceMinutes')::integer, 2) into grace from public.shachris_settings;
	if p_mode = 'reset' then
		if public.shachris_start_has_activity(p_session_id) then raise exception 'Attendance or milestone activity exists. Correct the start time instead; history cannot be reset.'; end if;
		update public.shachris_sessions set started_at = null, started_by_name = '', milestone_times = milestone_times - 'hodu' where id = p_session_id returning * into session_row;
	else
		if p_new_start is null or p_new_start::date <> current_date or p_new_start > clock_timestamp() then raise exception 'Choose a valid start time today, not in the future'; end if;
		if exists(select 1 from jsonb_each_text(session_row.milestone_times) milestone where milestone.key <> 'hodu' and p_new_start > milestone.value::timestamptz) then raise exception 'Start time cannot be after a recorded communal milestone'; end if;
		select coalesce(jsonb_agg(jsonb_build_object('studentId', student_id, 'arrivalAt', arrival_at, 'minutesLate', late_minutes) order by student_id), '[]'::jsonb) into before_arrivals from public.shachris_student_records where session_id = p_session_id and arrival_at is not null;
		update public.shachris_sessions set started_at = p_new_start, config = jsonb_set(config, '{arrivalGraceMinutes}', to_jsonb(grace), true), milestone_times = jsonb_set(milestone_times, '{hodu}', to_jsonb(p_new_start), true) where id = p_session_id returning * into session_row;
		update public.shachris_student_records set late_minutes = case when arrival_at <= p_new_start + make_interval(mins => grace) then 0 else greatest(0, floor(extract(epoch from (arrival_at - p_new_start)) / 60)::integer) end,
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
			where session_id = p_session_id and arrival_at is not null;
	end if;
	insert into public.shachris_start_audit(session_id, action, previous_start, new_start, reason, actor_name, detail)
		values(p_session_id, case p_mode when 'reset' then 'reset' else 'corrected' end, previous_start, session_row.started_at, btrim(p_reason), p_actor_name,
			jsonb_build_object('previousGraceMinutes', previous_grace, 'graceMinutes', grace, 'previousArrivals', before_arrivals));
	return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record join public.students student on student.id = record.student_id join public.student_class_assignments assignment on assignment.student_id = student.id where record.session_id = p_session_id and student.is_active is not false and assignment.class_id in ('yk-a','yk-b')), '[]'::jsonb));
end $$;

revoke all on function public.shachris_apply_arrival_grace(), public.shachris_validate_grace(), public.shachris_start_has_activity(uuid), public.shachris_start_correction_state(uuid), public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean) from public, anon, authenticated;
grant execute on function public.shachris_start_correction_state(uuid), public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean) to authenticated;
notify pgrst, 'reload schema';
commit;
