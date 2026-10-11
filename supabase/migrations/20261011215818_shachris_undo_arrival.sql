begin;

create function public.shachris_undo_arrival(
  p_session_id uuid, p_student_id bigint, p_revision integer,
  p_reason text, p_actor_name text, p_confirmed boolean
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  session_row public.shachris_sessions;
  record_row public.shachris_student_records;
  arrival_event public.shachris_events;
  previous_status text;
  before_record jsonb;
  happened_at timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.dashboard_has_permission('attendance', 'edit') then
    raise exception 'Shachris editing denied';
  end if;
  if p_confirmed is distinct from true or nullif(btrim(p_reason), '') is null or nullif(btrim(p_actor_name), '') is null then
    raise exception 'Confirm Undo Arrival and provide a reason and actor';
  end if;
  if length(p_reason) > 500 then raise exception 'Arrival correction reason is too long'; end if;
  select * into session_row from public.shachris_sessions where id = p_session_id for update;
  if session_row.id is null or session_row.voided_at is not null or session_row.started_at is null
    or session_row.session_date <> current_date then
    raise exception 'Undo Arrival requires today active Hodu session';
  end if;
  if session_row.milestone_times ? 'live-session-ended' then
    raise exception 'Live session ended. Use deliberate correction/history editing.';
  end if;
  select * into record_row from public.shachris_student_records
    where session_id = p_session_id and student_id = p_student_id for update;
  if record_row.student_id is null or record_row.revision is distinct from p_revision then
    raise exception 'Session changed. Reload before correcting arrival.';
  end if;
  if record_row.presence <> 'present' or record_row.arrival_at is null then
    raise exception 'Student does not have an arrival to undo';
  end if;
  if record_row.leave_intervals <> '[]'::jsonb or record_row.last_return_at is not null
    or record_row.personally_cleared_at is not null or record_row.personally_cleared_by is not null
    or record_row.personally_cleared_by_name <> '' or record_row.personally_cleared_milestone is not null
    or record_row.requirement_result <> 'pending'
    or record_row.requirement_met_at is not null or record_row.requirement_met_milestone is not null
    or record_row.extra_stay_intervals <> '[]'::jsonb or record_row.stayed_beyond_required
    or record_row.historical_result is not null then
    raise exception 'Later attendance/completion facts exist. Use deliberate correction/history editing; Undo Arrival will not remove them.';
  end if;
  select * into arrival_event from public.shachris_events
    where session_id = p_session_id and student_id = p_student_id and event_type = 'arrival'
      and (detail->>'at')::timestamptz = record_row.arrival_at
    order by created_at desc, id desc limit 1;
  if arrival_event.id is null then
    raise exception 'Original arrival audit not found. Use deliberate correction/history editing.';
  end if;
  if arrival_event.detail->>'bulkAtStart' = 'true' then
    previous_status := null;
  elsif arrival_event.detail ? 'previousAbsenceStatus' then
    previous_status := arrival_event.detail->>'previousAbsenceStatus';
  else
    raise exception 'Pre-arrival status is not recorded. Use deliberate correction/history editing.';
  end if;
  if previous_status is not null and previous_status not in ('absent', 'excused', 'not_in_shul') then
    raise exception 'Pre-arrival status is invalid. Use deliberate correction/history editing.';
  end if;
  before_record := to_jsonb(record_row);
  update public.shachris_student_records
    set presence = case when previous_status is null then 'unmarked' else 'absent' end,
      absence_status = previous_status, arrival_at = null,
      late_minutes = null, late_reason = null, late_reason_note = '', late_excused = false,
      revision = revision + 1, updated_by = auth.uid(), updated_by_name = btrim(p_actor_name), updated_at = happened_at
    where session_id = p_session_id and student_id = p_student_id returning * into record_row;
  insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
    values(p_session_id, p_student_id, 'arrival-correction',
      jsonb_build_object('action', 'undo-arrival', 'arrivalEventId', arrival_event.id,
        'reason', btrim(p_reason), 'before', before_record, 'after', to_jsonb(record_row)),
      btrim(p_actor_name));
  return to_jsonb(record_row);
end $$;

revoke all on function public.shachris_undo_arrival(uuid, bigint, integer, text, text, boolean) from public, anon;
grant execute on function public.shachris_undo_arrival(uuid, bigint, integer, text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
commit;