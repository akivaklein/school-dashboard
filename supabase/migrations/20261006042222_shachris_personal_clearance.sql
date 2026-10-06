begin;

alter table public.shachris_student_records
	add column late_minutes integer check (late_minutes >= 0),
	add column late_reason text check (late_reason in ('transportation', 'excused', 'no_reason', 'other')),
	add column late_reason_note text not null default '',
	add column late_excused boolean not null default false,
	add column absence_status text check (absence_status in ('absent', 'excused', 'not_in_shul')),
	add column personally_cleared_at timestamptz,
	add column personally_cleared_by uuid references auth.users(id),
	add column personally_cleared_by_name text not null default '',
	add column personally_cleared_milestone text,
	add column extra_stay_intervals jsonb not null default '[]'::jsonb check (jsonb_typeof(extra_stay_intervals) = 'array'),
	add column stayed_beyond_required boolean not null default false;

update public.shachris_student_records record set late_minutes = greatest(0, floor(extract(epoch from (record.arrival_at - session.started_at)) / 60)::integer)
	from public.shachris_sessions session where record.session_id = session.id and record.arrival_at is not null and session.started_at is not null;
update public.shachris_student_records set absence_status = 'absent' where presence = 'absent';

create or replace function public.shachris_mark_milestone(p_session_id uuid, p_milestone_id text, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	previous_id text;
	already_marked boolean;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_milestone_id is null or p_milestone_id not in ('shemoneh-esrei', 'chazaras-hashatz', 'end-davening') then raise exception 'Unsupported communal milestone'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date or session_row.started_at is null then raise exception 'Start today Hodu session first'; end if;
	if not exists (select 1 from jsonb_array_elements(session_row.config->'stayMilestones') entry where entry->>'id' = p_milestone_id) then raise exception 'Milestone not configured'; end if;
	already_marked := session_row.milestone_times ? p_milestone_id;
	if not already_marked then
		previous_id := case p_milestone_id when 'shemoneh-esrei' then 'hodu' when 'chazaras-hashatz' then 'shemoneh-esrei' else 'chazaras-hashatz' end;
		if not session_row.milestone_times ? previous_id then raise exception 'Mark the previous communal milestone first'; end if;
		update public.shachris_sessions set milestone_times = jsonb_set(milestone_times, array[p_milestone_id], to_jsonb(clock_timestamp()), true)
			where id = p_session_id returning * into session_row;
	end if;
	return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record where record.session_id = p_session_id), '[]'::jsonb), 'metCount', 0, 'notMetCount', 0, 'alreadyMarked', already_marked);
end $$;

create function public.shachris_update_daily_fact(p_session_id uuid, p_student_id bigint, p_action text, p_detail jsonb, p_actor_name text, p_record_revision integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	record_row public.shachris_student_records;
	happened_at timestamptz := clock_timestamp();
	reason_value text;
	status_value text;
	excused_value boolean;
	milestone_id text;
	previous_absence text;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date or session_row.started_at is null then raise exception 'Start today Hodu session first'; end if;
	select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = p_student_id for update;
	if record_row.student_id is null then raise exception 'Student session record not found'; end if;
	if record_row.revision is distinct from p_record_revision then raise exception 'Another staff member changed this student. Reload before saving.'; end if;
	previous_absence := record_row.absence_status;
	if p_detail is null or jsonb_typeof(p_detail) <> 'object' then raise exception 'Invalid daily detail'; end if;
	if p_action = 'late-reason' then
		if record_row.arrival_at is null or record_row.arrival_at <= session_row.started_at then raise exception 'Student did not arrive late'; end if;
		reason_value := p_detail->>'reason';
		if reason_value is null or reason_value not in ('transportation', 'excused', 'no_reason', 'other') then raise exception 'Choose a valid late reason'; end if;
		excused_value := reason_value = 'excused' or coalesce((p_detail->>'excused')::boolean, false);
		if reason_value = 'no_reason' and excused_value then raise exception 'Choose Excused when excusing without a reason'; end if;
		if length(coalesce(p_detail->>'note', '')) > 500 then raise exception 'Late reason note is too long'; end if;
		update public.shachris_student_records set late_reason = reason_value, late_reason_note = case when reason_value = 'other' then btrim(coalesce(p_detail->>'note', '')) else '' end, late_excused = excused_value
			where session_id = p_session_id and student_id = p_student_id;
	elsif p_action = 'nonattendance' then
		status_value := p_detail->>'status';
		if status_value is null or status_value not in ('unmarked', 'absent', 'excused', 'not_in_shul') then raise exception 'Choose a valid nonattendance status'; end if;
		if record_row.arrival_at is not null or record_row.presence not in ('unmarked', 'absent') then raise exception 'Record a departure for a student who has arrived'; end if;
		update public.shachris_student_records set presence = case when status_value = 'unmarked' then 'unmarked' else 'absent' end, absence_status = nullif(status_value, 'unmarked')
			where session_id = p_session_id and student_id = p_student_id;
	elsif p_action = 'personal-clearance' then
		milestone_id := record_row.stay_requirement->>'requiredUntil';
		if record_row.presence <> 'present' or milestone_id is null or not session_row.milestone_times ? milestone_id then raise exception 'Student must be In Shul and the required communal milestone must have passed'; end if;
		if record_row.personally_cleared_at is not null then return to_jsonb(record_row); end if;
		update public.shachris_student_records set personally_cleared_at = happened_at, personally_cleared_by = auth.uid(), personally_cleared_by_name = p_actor_name,
			personally_cleared_milestone = milestone_id, requirement_result = 'met', requirement_met_at = happened_at, requirement_met_milestone = milestone_id,
			extra_stay_intervals = extra_stay_intervals || jsonb_build_array(jsonb_build_object('startedAt', happened_at, 'endedAt', null))
			where session_id = p_session_id and student_id = p_student_id;
	else
		raise exception 'Unsupported daily fact';
	end if;
	update public.shachris_student_records set revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
		where session_id = p_session_id and student_id = p_student_id returning * into record_row;
	insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		values(p_session_id, p_student_id, p_action, jsonb_build_object('at', happened_at, 'previousAbsenceStatus', previous_absence, 'fact', p_detail, 'requiredMilestone', record_row.stay_requirement->>'requiredUntil'), p_actor_name);
	return to_jsonb(record_row);
end $$;

create or replace function public.shachris_record_presence_event(p_session_id uuid, p_student_id bigint, p_event_type text, p_permission text, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	record_row public.shachris_student_records;
	happened_at timestamptz := clock_timestamp();
	interval_index integer;
	extra_index integer;
	detail_value jsonb;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	if p_event_type is null or p_event_type not in ('arrival', 'left', 'returned') then raise exception 'Unsupported attendance event'; end if;
	if p_event_type = 'left' and (p_permission is null or p_permission not in ('with', 'without')) then raise exception 'Choose departure permission'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.started_at is null or session_row.session_date <> current_date then raise exception 'Start today Hodu session first'; end if;
	select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = p_student_id for update;
	if record_row.student_id is null then raise exception 'Student session record not found'; end if;
	if p_event_type = 'arrival' then
		if record_row.presence in ('left', 'present') then raise exception 'Student is already present or must use Returned'; end if;
		update public.shachris_student_records set presence = 'present', absence_status = null, arrival_at = coalesce(arrival_at, happened_at),
			late_minutes = greatest(0, floor(extract(epoch from (coalesce(arrival_at, happened_at) - session_row.started_at)) / 60)::integer),
			late_reason = case when coalesce(arrival_at, happened_at) > session_row.started_at then coalesce(late_reason, 'no_reason') else late_reason end
			where session_id = p_session_id and student_id = p_student_id;
		detail_value := jsonb_build_object('at', happened_at, 'previousAbsenceStatus', record_row.absence_status);
	elsif p_event_type = 'left' then
		if record_row.presence <> 'present' then raise exception 'Only a student currently In Shul can leave'; end if;
		extra_index := jsonb_array_length(record_row.extra_stay_intervals) - 1;
		update public.shachris_student_records set presence = 'left',
			leave_intervals = leave_intervals || jsonb_build_array(jsonb_build_object('leftAt', happened_at, 'returnedAt', null, 'permission', p_permission)),
			extra_stay_intervals = case when extra_index >= 0 and extra_stay_intervals->extra_index->>'endedAt' is null then jsonb_set(extra_stay_intervals, array[extra_index::text, 'endedAt'], to_jsonb(happened_at), false) else extra_stay_intervals end,
			stayed_beyond_required = stayed_beyond_required or (extra_index >= 0 and extra_stay_intervals->extra_index->>'endedAt' is null and happened_at > (extra_stay_intervals->extra_index->>'startedAt')::timestamptz)
			where session_id = p_session_id and student_id = p_student_id;
		detail_value := jsonb_build_object('at', happened_at, 'permission', p_permission);
	else
		interval_index := jsonb_array_length(record_row.leave_intervals) - 1;
		if record_row.presence <> 'left' or interval_index < 0 or record_row.leave_intervals->interval_index->>'returnedAt' is not null then raise exception 'Student does not have an open leave interval'; end if;
		update public.shachris_student_records set presence = 'present', last_return_at = happened_at,
			leave_intervals = jsonb_set(leave_intervals, array[interval_index::text, 'returnedAt'], to_jsonb(happened_at), false),
			extra_stay_intervals = case when personally_cleared_at is not null then extra_stay_intervals || jsonb_build_array(jsonb_build_object('startedAt', happened_at, 'endedAt', null)) else extra_stay_intervals end
			where session_id = p_session_id and student_id = p_student_id;
		detail_value := jsonb_build_object('at', happened_at);
	end if;
	update public.shachris_student_records set revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = happened_at
		where session_id = p_session_id and student_id = p_student_id returning * into record_row;
	insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		values(p_session_id, p_student_id, p_event_type, detail_value || jsonb_build_object('minutesLate', record_row.late_minutes, 'extraStayIntervals', record_row.extra_stay_intervals, 'stayedBeyondRequired', record_row.stayed_beyond_required), p_actor_name);
	return to_jsonb(record_row);
end $$;

create or replace function public.shachris_bulk_arrive_at_start(p_session_id uuid, p_student_ids bigint[], p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	session_row public.shachris_sessions;
	student_id_value bigint;
	record_row public.shachris_student_records;
	changed jsonb := '[]'::jsonb;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.started_at is null or session_row.session_date <> current_date then raise exception 'Start today Hodu session first'; end if;
	for student_id_value in select distinct unnest(p_student_ids) order by 1 loop
		select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = student_id_value for update;
		if record_row.student_id is null then raise exception 'Student session record not found'; end if;
		if record_row.presence <> 'unmarked' or record_row.arrival_at is not null then continue; end if;
		update public.shachris_student_records set presence = 'present', arrival_at = session_row.started_at, late_minutes = 0,
			revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
			where session_id = p_session_id and student_id = student_id_value returning * into record_row;
		insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
			values(p_session_id, student_id_value, 'arrival', jsonb_build_object('at', session_row.started_at, 'bulkAtStart', true, 'minutesLate', 0), p_actor_name);
		changed := changed || jsonb_build_array(to_jsonb(record_row));
	end loop;
	return changed;
end $$;

create or replace function public.shachris_save_records(p_session_id uuid, p_records jsonb, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
	incoming jsonb;
	existing public.shachris_student_records;
	session_row public.shachris_sessions;
	saved jsonb := '[]'::jsonb;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null then raise exception 'Session not found'; end if;
	if p_records is null or jsonb_typeof(p_records) <> 'array' then raise exception 'Invalid records'; end if;
	for incoming in select entry from jsonb_array_elements(p_records) entry order by (entry->>'student_id')::bigint loop
		select * into existing from public.shachris_student_records where session_id = p_session_id and student_id = (incoming->>'student_id')::bigint for update;
		if existing.student_id is null or existing.revision is distinct from (incoming->>'revision')::integer then raise exception 'Session changed. Reload before saving.'; end if;
		if incoming ? 'presence' and incoming->>'presence' is distinct from existing.presence then raise exception 'Use attendance actions to change presence'; end if;
		if jsonb_typeof(incoming->'said_section_ids') is distinct from 'array' or exists (select 1 from jsonb_array_elements_text(incoming->'said_section_ids') section_id where not exists (select 1 from jsonb_array_elements(session_row.config->'sections') section where section->>'id' = section_id)) then raise exception 'Invalid section'; end if;
		if coalesce(incoming->>'rating_id', '') <> '' and not exists (select 1 from jsonb_array_elements(session_row.config->'ratings') rating where rating->>'id' = incoming->>'rating_id') then raise exception 'Invalid rating'; end if;
		update public.shachris_student_records set said_section_ids = incoming->'said_section_ids', rating_id = coalesce(incoming->>'rating_id', ''), note = coalesce(incoming->>'note', ''), revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
			where session_id = p_session_id and student_id = existing.student_id returning * into existing;
		saved := saved || jsonb_build_array(to_jsonb(existing));
	end loop;
	return saved;
end $$;

create function public.shachris_guard_cleared_requirement()
returns trigger language plpgsql set search_path = public as $$
begin
	if old.personally_cleared_at is not null then raise exception 'A personally cleared requirement cannot be changed'; end if;
	return new;
end $$;
create trigger shachris_cleared_requirement_guard before update of stay_requirement on public.shachris_student_records for each row execute function public.shachris_guard_cleared_requirement();

revoke all on function public.shachris_update_daily_fact(uuid, bigint, text, jsonb, text, integer), public.shachris_guard_cleared_requirement() from public, anon, authenticated;
grant execute on function public.shachris_update_daily_fact(uuid, bigint, text, jsonb, text, integer) to authenticated;
notify pgrst, 'reload schema';
commit;
