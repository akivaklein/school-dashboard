begin;

create function public.shachris_end_live_session(p_session_id uuid, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
	session_row public.shachris_sessions;
	ended_at timestamptz;
begin
	if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
	select * into session_row from public.shachris_sessions where id = p_session_id for update;
	if session_row.id is null or session_row.voided_at is not null or session_row.session_date <> current_date or session_row.started_at is null then raise exception 'Start today Hodu session first'; end if;
	if session_row.milestone_times ? 'live-session-ended' then return to_jsonb(session_row); end if;
	ended_at := clock_timestamp();
	update public.shachris_sessions set milestone_times = jsonb_set(milestone_times, '{live-session-ended}', to_jsonb(ended_at), true)
		where id = p_session_id returning * into session_row;
	insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
		select p_session_id, record.student_id, 'live-session-ended', jsonb_build_object('at', ended_at, 'notMarked', record.presence = 'unmarked'), p_actor_name
		from public.shachris_student_records record where record.session_id = p_session_id;
	return to_jsonb(session_row);
end $$;

revoke all on function public.shachris_end_live_session(uuid, text) from public, anon;
grant execute on function public.shachris_end_live_session(uuid, text) to authenticated;
notify pgrst, 'reload schema';
commit;
