begin;

alter table public.shachris_sessions
	add column if not exists started_at timestamptz,
	add column if not exists started_by_name text not null default '',
	add column if not exists milestone_times jsonb not null default '{}'::jsonb
		check (jsonb_typeof(milestone_times) = 'object');

alter table public.shachris_student_records
	add column if not exists stay_requirement jsonb not null default '{}'::jsonb
		check (jsonb_typeof(stay_requirement) = 'object'),
	add column if not exists arrival_at timestamptz,
	add column if not exists last_return_at timestamptz,
	add column if not exists leave_intervals jsonb not null default '[]'::jsonb
		check (jsonb_typeof(leave_intervals) = 'array'),
	add column if not exists requirement_result text not null default 'pending'
		check (requirement_result in ('pending', 'met', 'not_met')),
	add column if not exists requirement_met_at timestamptz,
	add column if not exists requirement_met_milestone text;

create table if not exists public.shachris_stay_expectations (
	id uuid primary key default gen_random_uuid(),
	student_id bigint not null references public.students(id) on delete restrict,
	mode text not null check (mode in ('manual', 'default')),
	required_until text,
	reason text not null default '',
	actor_name text not null,
	created_by uuid not null default auth.uid() references auth.users(id),
	effective_date date not null,
	duration text not null check (duration in ('today', 'future')),
	created_at timestamptz not null default clock_timestamp(),
	check ((mode = 'manual' and required_until in ('shemoneh-esrei', 'chazaras-hashatz', 'end-davening'))
		or (mode = 'default' and required_until is null))
);
create index if not exists shachris_stay_expectations_student_idx
	on public.shachris_stay_expectations(student_id, effective_date desc, created_at desc);

alter table public.shachris_stay_expectations enable row level security;
revoke all on public.shachris_stay_expectations from anon, authenticated;
grant select on public.shachris_stay_expectations to authenticated;
create policy shachris_stay_expectations_read on public.shachris_stay_expectations
	for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));

update public.shachris_settings
set config = config || jsonb_build_object(
	'stayMilestones', jsonb_build_array(
		jsonb_build_object('id', 'hodu', 'label', 'Start Hodu', 'order', 0),
		jsonb_build_object('id', 'shemoneh-esrei', 'label', 'After Shemoneh Esrei', 'order', 1),
		jsonb_build_object('id', 'chazaras-hashatz', 'label', 'After Chazaras HaShatz', 'order', 2),
		jsonb_build_object('id', 'end-davening', 'label', 'End Davening', 'order', 3)
	),
	'stayRules', jsonb_build_array(
		jsonb_build_object('id', 'age-11', 'age', 11, 'milestoneId', 'shemoneh-esrei'),
		jsonb_build_object('id', 'age-12', 'age', 12, 'milestoneId', 'chazaras-hashatz'),
		jsonb_build_object('id', 'age-13', 'age', 13, 'milestoneId', 'end-davening')
	)
), revision = revision + 1, updated_at = clock_timestamp()
where not (config ? 'stayRules');

update public.shachris_sessions session
set config = session.config || jsonb_build_object(
	'stayMilestones', settings.config->'stayMilestones', 'stayRules', settings.config->'stayRules')
from public.shachris_settings settings
where session.session_date = current_date and session.started_at is null and not (session.config ? 'stayRules');

create or replace function public.shachris_resolve_stay_requirement(p_student_id bigint, p_date date, p_config jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
	assignment public.shachris_stay_expectations;
	student_age integer;
	requirement_id text;
	requirement_source text;
	requirement_duration text;
	milestone jsonb;
begin
	select case when student.date_of_birth <= p_date
		then extract(year from age(p_date, student.date_of_birth))::integer else null end
		into student_age
	from public.students student where student.id = p_student_id;
	if not found then raise exception 'Student not found'; end if;

	select * into assignment from public.shachris_stay_expectations
	where student_id = p_student_id and effective_date <= p_date
		and (duration = 'future' or effective_date = p_date)
	order by effective_date desc, created_at desc, id desc limit 1;

	if assignment.id is not null and assignment.mode = 'manual' then
		requirement_id := assignment.required_until;
		requirement_source := 'manual';
		requirement_duration := assignment.duration;
	else
		select rule->>'milestoneId' into requirement_id
		from jsonb_array_elements(coalesce(p_config->'stayRules', '[]'::jsonb)) rule
		where student_age is not null and (rule->>'age')::integer = student_age
		limit 1;
		requirement_source := case when requirement_id is null then 'unassigned' else 'default' end;
		requirement_duration := null;
	end if;

	select entry into milestone from jsonb_array_elements(coalesce(p_config->'stayMilestones', '[]'::jsonb)) entry
	where entry->>'id' = requirement_id;
	return jsonb_build_object('age', student_age, 'requiredUntil', requirement_id,
		'label', coalesce(milestone->>'label', case when requirement_source = 'manual' then 'Requirement not set' else 'No age default' end),
		'source', requirement_source, 'duration', requirement_duration);
end $$;
revoke all on function public.shachris_resolve_stay_requirement(bigint, date, jsonb) from public, anon, authenticated;

update public.shachris_student_records record
set stay_requirement = public.shachris_resolve_stay_requirement(record.student_id, session.session_date, session.config)
from public.shachris_sessions session
where record.session_id = session.id and session.session_date = current_date and session.started_at is null
	and record.stay_requirement = '{}'::jsonb and record.requirement_result = 'pending';

create or replace function public.shachris_open_session(p_date date, p_student_ids bigint[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	student_id_value bigint;
	current_config jsonb;
begin
	if not public.dashboard_has_permission('attendance', 'view') then raise exception 'Shachris access denied'; end if;
	select * into session_row from public.shachris_sessions where session_date = p_date;
	if public.dashboard_has_permission('attendance', 'edit') then
		if session_row.id is null then
			insert into public.shachris_sessions(session_date, config)
				select p_date, config from public.shachris_settings
				on conflict (session_date) do nothing;
			select * into session_row from public.shachris_sessions where session_date = p_date;
		end if;
		if p_date = current_date and session_row.started_at is null and not (session_row.config ? 'stayRules') then
			select config into current_config from public.shachris_settings;
			update public.shachris_sessions set config = session_row.config || jsonb_build_object(
				'stayMilestones', current_config->'stayMilestones', 'stayRules', current_config->'stayRules')
				where id = session_row.id returning * into session_row;
		end if;
		for student_id_value in select distinct unnest(p_student_ids) order by 1 loop
			if not exists (select 1 from public.students where id = student_id_value and is_active is not false) then raise exception 'Student is not active'; end if;
			insert into public.shachris_student_records(session_id, student_id, expectation, stay_requirement)
				values(session_row.id, student_id_value,
					public.shachris_resolve_expectation(student_id_value, p_date, session_row.config),
					public.shachris_resolve_stay_requirement(student_id_value, p_date, session_row.config))
				on conflict (session_id, student_id) do nothing;
			if p_date = current_date and session_row.started_at is null then
				update public.shachris_student_records set stay_requirement = public.shachris_resolve_stay_requirement(student_id_value, p_date, session_row.config)
					where session_id = session_row.id and student_id = student_id_value and stay_requirement = '{}'::jsonb and requirement_result = 'pending';
			end if;
		end loop;
	end if;
	if session_row.id is null then raise exception 'No session exists on this date. An editor must open it first.'; end if;
	return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id)
		from public.shachris_student_records record where record.session_id = session_row.id and record.student_id = any(p_student_ids)), '[]'::jsonb));
end $$;

create function public.shachris_start_session(p_session_id uuid, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	started timestamptz;
begin
	if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date then raise exception 'Only today Shachris session can be started'; end if;
	if session_row.started_at is null then
		started := clock_timestamp();
		update public.shachris_sessions set started_at = started, started_by_name = p_actor_name,
			milestone_times = jsonb_set(milestone_times, '{hodu}', to_jsonb(started), true)
			where id = p_session_id returning * into session_row;
	end if;
	return to_jsonb(session_row);
end $$;

create function public.shachris_bulk_arrive_at_start(p_session_id uuid, p_student_ids bigint[], p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	student_id_value bigint;
	record_row public.shachris_student_records;
	changed jsonb := '[]'::jsonb;
begin
	if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.started_at is null or session_row.session_date <> current_date then raise exception 'Start Hodu before marking students present at session start'; end if;
	for student_id_value in select distinct unnest(p_student_ids) order by 1 loop
		select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = student_id_value for update;
		if record_row.student_id is null then raise exception 'Open this student in the session before marking arrival'; end if;
		if record_row.arrival_at is null and record_row.presence <> 'left' then
			update public.shachris_student_records set presence = 'present', arrival_at = session_row.started_at,
				revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
				where session_id = p_session_id and student_id = student_id_value returning * into record_row;
			insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
				values(p_session_id, student_id_value, 'arrival', jsonb_build_object('at', session_row.started_at, 'bulkAtStart', true), p_actor_name);
			changed := changed || jsonb_build_array(to_jsonb(record_row));
		end if;
	end loop;
	return changed;
end $$;

create function public.shachris_record_presence_event(p_session_id uuid, p_student_id bigint, p_event_type text, p_permission text, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	record_row public.shachris_student_records;
	happened_at timestamptz := clock_timestamp();
	late_minutes integer;
	interval_index integer;
	detail_value jsonb;
begin
	if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_event_type not in ('arrival', 'left', 'returned') then raise exception 'Unsupported attendance event'; end if;
	if p_event_type = 'left' and p_permission not in ('with', 'without') then raise exception 'Choose whether the departure is with or without permission'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.started_at is null or session_row.session_date <> current_date then raise exception 'Start today Hodu session first'; end if;
	select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = p_student_id for update;
	if record_row.student_id is null then raise exception 'Student session record not found'; end if;

	if p_event_type = 'arrival' then
		if record_row.presence = 'left' then raise exception 'Use Returned for a student who is currently out'; end if;
		if record_row.presence = 'present' then raise exception 'Student is already in shul'; end if;
		late_minutes := greatest(0, floor(extract(epoch from (happened_at - session_row.started_at)) / 60)::integer);
		update public.shachris_student_records set presence = 'present', arrival_at = coalesce(arrival_at, happened_at),
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
			where session_id = p_session_id and student_id = p_student_id returning * into record_row;
		detail_value := jsonb_build_object('at', happened_at, 'minutesLate', late_minutes);
	elsif p_event_type = 'left' then
		if record_row.presence <> 'present' then raise exception 'Only a student currently In Shul can leave'; end if;
		update public.shachris_student_records set presence = 'left',
			leave_intervals = leave_intervals || jsonb_build_array(jsonb_build_object('leftAt', happened_at, 'returnedAt', null, 'permission', p_permission)),
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
			where session_id = p_session_id and student_id = p_student_id returning * into record_row;
		detail_value := jsonb_build_object('at', happened_at, 'permission', p_permission);
	else
		if record_row.presence <> 'left' or jsonb_array_length(record_row.leave_intervals) = 0 then raise exception 'Student does not have an open leave interval'; end if;
		interval_index := jsonb_array_length(record_row.leave_intervals) - 1;
		if record_row.leave_intervals->interval_index->>'returnedAt' is not null then raise exception 'Student leave interval is already closed'; end if;
		update public.shachris_student_records set presence = 'present', last_return_at = happened_at,
			leave_intervals = jsonb_set(leave_intervals, array[interval_index::text, 'returnedAt'], to_jsonb(happened_at), false),
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
			where session_id = p_session_id and student_id = p_student_id returning * into record_row;
		detail_value := jsonb_build_object('at', happened_at);
	end if;
	insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		values(p_session_id, p_student_id, p_event_type, detail_value, p_actor_name);
	return to_jsonb(record_row);
end $$;

create function public.shachris_mark_milestone(p_session_id uuid, p_milestone_id text, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	milestone jsonb;
	previous_milestone jsonb;
	happened_at timestamptz := clock_timestamp();
	met_count integer := 0;
	not_met_count integer := 0;
begin
	if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_milestone_id not in ('shemoneh-esrei', 'chazaras-hashatz', 'end-davening') then raise exception 'Unsupported communal milestone'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date or session_row.started_at is null then raise exception 'Start Hodu before marking communal milestones'; end if;
	milestone := (select entry from jsonb_array_elements(session_row.config->'stayMilestones') entry where entry->>'id' = p_milestone_id);
	if milestone is null then raise exception 'Milestone is not configured for this session'; end if;
	if session_row.milestone_times ? p_milestone_id then
		return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record where record.session_id = p_session_id), '[]'::jsonb), 'metCount', 0, 'notMetCount', 0, 'alreadyMarked', true);
	end if;
	previous_milestone := case p_milestone_id when 'shemoneh-esrei' then session_row.milestone_times->'hodu' when 'chazaras-hashatz' then session_row.milestone_times->'shemoneh-esrei' else session_row.milestone_times->'chazaras-hashatz' end;
	if previous_milestone is null then raise exception 'Mark the previous communal milestone first'; end if;
	update public.shachris_sessions set milestone_times = jsonb_set(milestone_times, array[p_milestone_id], to_jsonb(happened_at), true)
		where id = p_session_id returning * into session_row;
	with evaluated as (
		update public.shachris_student_records set
			requirement_result = case when presence = 'present' then 'met' else 'not_met' end,
			requirement_met_at = case when presence = 'present' then happened_at else null end,
			requirement_met_milestone = p_milestone_id,
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
		where session_id = p_session_id and stay_requirement->>'requiredUntil' = p_milestone_id and requirement_result = 'pending'
		returning *
	), logged as (
		insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		select p_session_id, student_id, 'requirement-evaluated', jsonb_build_object('milestone', p_milestone_id, 'result', requirement_result, 'at', happened_at), p_actor_name from evaluated
		returning 1
	)
	select count(*) filter (where requirement_result = 'met'), count(*) filter (where requirement_result = 'not_met')
		into met_count, not_met_count from evaluated;
	return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record where record.session_id = p_session_id), '[]'::jsonb), 'metCount', met_count, 'notMetCount', not_met_count, 'alreadyMarked', false);
end $$;

create function public.shachris_set_stay_requirement(p_student_id bigint, p_mode text, p_required_until text, p_reason text, p_actor_name text, p_effective_date date, p_session_id uuid, p_record_revision integer, p_duration text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	record_row public.shachris_student_records;
	assignment_row public.shachris_stay_expectations;
begin
	if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Expectation editing denied'; end if;
	if p_mode not in ('manual', 'default') or p_duration not in ('today', 'future') then raise exception 'Choose a valid requirement and duration'; end if;
	if p_mode = 'manual' and p_required_until not in ('shemoneh-esrei', 'chazaras-hashatz', 'end-davening') then raise exception 'Choose a communal required-until milestone'; end if;
	perform 1 from public.students where id = p_student_id and is_active is not false for update;
	if not found then raise exception 'Student is not active'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id;
	if session_row.session_date <> p_effective_date or session_row.session_date <> current_date or session_row.id is null then raise exception 'Requirement changes are available for today only'; end if;
	select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = p_student_id for update;
	if record_row.revision is distinct from p_record_revision then raise exception 'Another staff member changed this student. Reload before changing requirements.'; end if;
	if p_mode = 'manual' and session_row.milestone_times ? p_required_until then raise exception 'That communal milestone has already passed today'; end if;
	insert into public.shachris_stay_expectations(student_id, mode, required_until, reason, actor_name, effective_date, duration)
		values(p_student_id, p_mode, case when p_mode = 'manual' then p_required_until else null end, p_reason, p_actor_name, p_effective_date, p_duration)
		returning * into assignment_row;
	update public.shachris_student_records set stay_requirement = public.shachris_resolve_stay_requirement(p_student_id, p_effective_date, session_row.config),
		requirement_result = 'pending', requirement_met_at = null, requirement_met_milestone = null,
		revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
	where session_id = p_session_id and student_id = p_student_id returning * into record_row;
	return jsonb_build_object('assignment', to_jsonb(assignment_row), 'record', to_jsonb(record_row));
end $$;

create or replace function public.shachris_save_settings(p_config jsonb, p_revision integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare settings_row public.shachris_settings;
begin
	if not public.dashboard_is_admin() or not public.dashboard_has_permission('setup', 'edit') then raise exception 'Only leadership can change Shachris settings'; end if;
	select * into settings_row from public.shachris_settings for update;
	if settings_row.revision is distinct from p_revision then raise exception 'Settings changed elsewhere. Reload before saving.'; end if;
	if jsonb_typeof(p_config->'sections') is distinct from 'array' or jsonb_typeof(p_config->'milestones') is distinct from 'array'
		or jsonb_typeof(p_config->'ratings') is distinct from 'array' or jsonb_typeof(p_config->'rules') is distinct from 'array'
		or jsonb_typeof(p_config->'stayMilestones') is distinct from 'array' or jsonb_typeof(p_config->'stayRules') is distinct from 'array'
		or jsonb_array_length(p_config->'sections') = 0 or jsonb_array_length(p_config->'milestones') = 0 then raise exception 'Invalid Shachris settings'; end if;
	if exists (select 1 from jsonb_array_elements(p_config->'stayRules') rule
		where jsonb_typeof(rule) <> 'object' or coalesce(rule->>'id', '') = '' or (rule - 'id' - 'age' - 'milestoneId') <> '{}'::jsonb
			or coalesce(rule->>'age', '') not in ('11', '12', '13')
			or not exists (select 1 from jsonb_array_elements(p_config->'stayMilestones') milestone where milestone->>'id' = rule->>'milestoneId' and milestone->>'id' <> 'hodu'))
		or exists (select 1 from jsonb_array_elements(p_config->'stayRules') rule group by rule->>'age' having count(*) > 1)
		then raise exception 'Stay defaults must use one rule each for ages 11, 12, or 13'; end if;
	if exists (select 1 from jsonb_array_elements(p_config->'rules') rule
		where jsonb_typeof(rule) <> 'object' or coalesce(rule->>'grade', '') not in ('7', '8')
			or coalesce(rule->>'id', '') = '' or (rule - 'id' - 'grade' - 'milestoneId') <> '{}'::jsonb
			or not exists (select 1 from jsonb_array_elements(p_config->'milestones') milestone where milestone->>'id' = rule->>'milestoneId'))
		or exists (select 1 from jsonb_array_elements(p_config->'rules') rule group by rule->>'grade' having count(*) > 1)
		or exists (select 1 from jsonb_array_elements(p_config->'rules') rule group by rule->>'id' having count(*) > 1)
		then raise exception 'Davening progress defaults must use one rule per actual grade only'; end if;
	if exists (select 1 from jsonb_array_elements(settings_row.config->'sections') prior where not exists (select 1 from jsonb_array_elements(p_config->'sections') next where next->>'id' = prior->>'id'))
		or exists (select 1 from jsonb_array_elements(settings_row.config->'milestones') prior where not exists (select 1 from jsonb_array_elements(p_config->'milestones') next where next->>'id' = prior->>'id'))
		or exists (select 1 from jsonb_array_elements(settings_row.config->'stayMilestones') prior where not exists (select 1 from jsonb_array_elements(p_config->'stayMilestones') next where next->>'id' = prior->>'id'))
		then raise exception 'Existing section and milestone IDs must be preserved'; end if;
	update public.shachris_settings set config = p_config, revision = revision + 1, updated_by = auth.uid(), updated_at = clock_timestamp() returning * into settings_row;
	return to_jsonb(settings_row);
end $$;

revoke all on function public.shachris_open_session(date, bigint[]), public.shachris_start_session(uuid, text), public.shachris_bulk_arrive_at_start(uuid, bigint[], text), public.shachris_record_presence_event(uuid, bigint, text, text, text), public.shachris_mark_milestone(uuid, text, text), public.shachris_set_stay_requirement(bigint, text, text, text, text, date, uuid, integer, text) from public, anon;
grant execute on function public.shachris_open_session(date, bigint[]), public.shachris_start_session(uuid, text), public.shachris_bulk_arrive_at_start(uuid, bigint[], text), public.shachris_record_presence_event(uuid, bigint, text, text, text), public.shachris_mark_milestone(uuid, text, text), public.shachris_set_stay_requirement(bigint, text, text, text, text, date, uuid, integer, text) to authenticated;

notify pgrst, 'reload schema';
commit;
