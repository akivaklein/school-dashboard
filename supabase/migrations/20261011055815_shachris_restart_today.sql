begin;

alter table public.shachris_sessions
	add column voided_at timestamptz,
	add column voided_by uuid references auth.users(id),
	add column void_reason text,
	add column restarted_from uuid unique references public.shachris_sessions(id) on delete restrict;
alter table public.shachris_sessions drop constraint shachris_sessions_session_date_key;
create unique index shachris_sessions_active_date_key on public.shachris_sessions(session_date) where voided_at is null;
alter table public.shachris_start_audit drop constraint shachris_start_audit_action_check;
alter table public.shachris_start_audit add constraint shachris_start_audit_action_check check (action in ('started', 'reset', 'corrected', 'restarted'));

create function public.shachris_guard_voided_session()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
	session_id_value uuid;
	void_time timestamptz;
begin
	if tg_table_name = 'shachris_sessions' then
		if old.voided_at is not null then raise exception 'Session was restarted. Reload the active session.'; end if;
	else
		session_id_value := case when tg_op = 'DELETE' then old.session_id else new.session_id end;
		select voided_at into void_time from public.shachris_sessions where id = session_id_value for share;
		if void_time is not null then raise exception 'Session was restarted. Reload the active session.'; end if;
	end if;
	if tg_op = 'DELETE' then return old; end if;
	return new;
end $$;
create trigger shachris_sessions_preserve_voided before update or delete on public.shachris_sessions for each row execute function public.shachris_guard_voided_session();
create trigger shachris_records_preserve_voided before insert or update or delete on public.shachris_student_records for each row execute function public.shachris_guard_voided_session();
create trigger shachris_events_preserve_voided before insert or update or delete on public.shachris_events for each row execute function public.shachris_guard_voided_session();
revoke all on function public.shachris_guard_voided_session() from public, anon, authenticated;

create or replace function public.shachris_open_session(p_date date, p_student_ids bigint[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
	session_row public.shachris_sessions;
	student_id_value bigint;
	eligible_ids bigint[];
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'view') then raise exception 'Shachris access denied'; end if;
	select coalesce(array_agg(student.id order by student.id), '{}'::bigint[]) into eligible_ids
		from public.students student join public.student_class_assignments assignment on assignment.student_id = student.id
		where student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b') and student.id = any(p_student_ids);
	select * into session_row from public.shachris_sessions where session_date = p_date and voided_at is null for share;
	if public.dashboard_has_permission('attendance', 'edit') then
		if session_row.id is null then
			insert into public.shachris_sessions(session_date, config) select p_date, config from public.shachris_settings where id = true
				on conflict (session_date) where voided_at is null do nothing;
			select * into session_row from public.shachris_sessions where session_date = p_date and voided_at is null for share;
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

alter function public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean) rename to shachris_correct_start_before_restart;
revoke all on function public.shachris_correct_start_before_restart(uuid,text,timestamptz,timestamptz,text,text,boolean) from public, anon, authenticated;

create function public.shachris_correct_start(p_session_id uuid, p_mode text, p_new_start timestamptz, p_expected_start timestamptz, p_reason text, p_actor_name text, p_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
	session_row public.shachris_sessions;
	fresh_session public.shachris_sessions;
	eligible_ids bigint[];
	reopened jsonb;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.session_date <> current_date then raise exception 'Only today session can be corrected'; end if;
	if session_row.voided_at is not null then raise exception 'Session was restarted. Reload the active session.'; end if;
	if p_mode is distinct from 'restart' then
		return public.shachris_correct_start_before_restart(p_session_id, p_mode, p_new_start, p_expected_start, p_reason, p_actor_name, p_confirmed);
	end if;
	if p_confirmed is distinct from true or nullif(btrim(p_reason), '') is null or length(p_reason) > 500
		or nullif(btrim(p_actor_name), '') is null or length(p_actor_name) > 200 then raise exception 'Confirm the restart and provide a reason and actor'; end if;
	if session_row.started_at is distinct from p_expected_start then raise exception 'Hodu start changed. Reload before restarting.'; end if;
	update public.shachris_sessions set voided_at = clock_timestamp(), voided_by = auth.uid(), void_reason = btrim(p_reason) where id = p_session_id;
	insert into public.shachris_sessions(session_date, config, restarted_from)
		select current_date, config, p_session_id from public.shachris_settings where id = true returning * into fresh_session;
	if fresh_session.id is null then raise exception 'Shachris settings missing'; end if;
	select coalesce(array_agg(student.id order by student.id), '{}'::bigint[]) into eligible_ids
		from public.students student join public.student_class_assignments assignment on assignment.student_id = student.id
		where student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b');
	reopened := public.shachris_open_session(current_date, eligible_ids);
	insert into public.shachris_start_audit(session_id, action, previous_start, new_start, reason, actor_name, detail)
		values(p_session_id, 'restarted', session_row.started_at, null, btrim(p_reason), btrim(p_actor_name),
			jsonb_build_object('previousSessionId', p_session_id, 'newSessionId', fresh_session.id));
	return reopened;
end $$;
revoke all on function public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean) from public, anon, authenticated;
grant execute on function public.shachris_correct_start(uuid,text,timestamptz,timestamptz,text,text,boolean) to authenticated;

create or replace function public.shachris_start_correction_state(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
	session_day date;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select session_date into session_day from public.shachris_sessions where id = p_session_id and voided_at is null;
	if session_day is distinct from current_date then raise exception 'Only today active session can be corrected'; end if;
	return jsonb_build_object('hasActivity', public.shachris_start_has_activity(p_session_id), 'audit',
		coalesce((select jsonb_agg(to_jsonb(entry) order by entry.created_at desc, entry.id) from public.shachris_start_audit entry
			join public.shachris_sessions session on session.id = entry.session_id where session.session_date = session_day), '[]'::jsonb));
end $$;

do $$
declare
	definition text;
begin
	definition := pg_get_functiondef('public.shachris_save_historical_day(date,bigint,jsonb,integer,text,text)'::regprocedure);
	if position('where session_date = p_date for update' in definition) = 0 or position('on conflict (session_date) do nothing' in definition) = 0 then
		raise exception 'Historical day RPC differs from the reviewed implementation';
	end if;
	definition := replace(definition, 'where session_date = p_date for update', 'where session_date = p_date and voided_at is null for update');
	definition := replace(definition, 'on conflict (session_date) do nothing', 'on conflict (session_date) where voided_at is null do nothing');
	execute definition;
end $$;

notify pgrst, 'reload schema';
commit;
