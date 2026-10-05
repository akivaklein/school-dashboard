begin;

alter table public.students add column if not exists date_of_birth date;

create table public.shachris_settings (
  id boolean primary key default true check (id),
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  revision integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.shachris_settings (config) values ('{
  "sections":[{"id":"baruch-sheamar","label":"Baruch Sheamar"},{"id":"ashrei","label":"Ashrei"},{"id":"shema","label":"Shema"},{"id":"shemoneh-esrei","label":"Shemoneh Esrei"}],
  "milestones":[{"id":"start","label":"Baruch Sheamar","sectionIds":["baruch-sheamar"]},{"id":"ashrei","label":"Through Ashrei","sectionIds":["baruch-sheamar","ashrei"]},{"id":"shema","label":"Through Shema","sectionIds":["baruch-sheamar","ashrei","shema"]},{"id":"full","label":"Through Shemoneh Esrei","sectionIds":["baruch-sheamar","ashrei","shema","shemoneh-esrei"]}],
  "ratings":[{"id":"vg","label":"Very Good"},{"id":"g","label":"Good"},{"id":"ni","label":"Needs Improvement"}],
  "rules":[],"fallbackMilestoneId":"start"
}'::jsonb);

create table public.shachris_expectations (
  id uuid primary key default gen_random_uuid(),
  student_id bigint not null references public.students(id) on delete restrict,
  mode text not null check (mode in ('manual', 'default')),
  milestone_id text,
  section_ids jsonb check (section_ids is null or jsonb_typeof(section_ids) = 'array'),
  reason text not null default '',
  actor_name text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  effective_date date not null,
  created_at timestamptz not null default clock_timestamp(),
  check ((mode = 'manual' and milestone_id is not null) or (mode = 'default' and milestone_id is null and section_ids is null))
);
create index shachris_expectations_student_idx on public.shachris_expectations(student_id, effective_date desc, created_at desc);

create table public.shachris_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null unique,
  config jsonb not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.shachris_student_records (
  session_id uuid not null references public.shachris_sessions(id) on delete restrict,
  student_id bigint not null references public.students(id) on delete restrict,
  expectation jsonb not null,
  presence text not null default 'unmarked' check (presence in ('unmarked', 'present', 'absent', 'left')),
  said_section_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(said_section_ids) = 'array'),
  rating_id text not null default '',
  note text not null default '',
  revision integer not null default 0,
  updated_by uuid not null default auth.uid() references auth.users(id),
  updated_by_name text not null default '',
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index shachris_student_records_student_idx on public.shachris_student_records(student_id, session_id);

create table public.shachris_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  student_id bigint not null,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  actor_name text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (session_id, student_id) references public.shachris_student_records(session_id, student_id) on delete restrict
);
create index shachris_events_session_idx on public.shachris_events(session_id, student_id, created_at);

alter table public.shachris_settings enable row level security;
alter table public.shachris_expectations enable row level security;
alter table public.shachris_sessions enable row level security;
alter table public.shachris_student_records enable row level security;
alter table public.shachris_events enable row level security;

revoke all on public.shachris_settings, public.shachris_expectations, public.shachris_sessions, public.shachris_student_records, public.shachris_events from anon, authenticated;
grant select on public.shachris_settings, public.shachris_expectations, public.shachris_sessions, public.shachris_student_records, public.shachris_events to authenticated;

create policy shachris_settings_read on public.shachris_settings for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));
create policy shachris_expectations_read on public.shachris_expectations for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));
create policy shachris_sessions_read on public.shachris_sessions for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));
create policy shachris_records_read on public.shachris_student_records for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));
create policy shachris_events_read on public.shachris_events for select to authenticated using (public.dashboard_has_permission('attendance', 'view'));

create or replace function public.shachris_resolve_expectation(p_student_id bigint, p_date date, p_config jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  assignment public.shachris_expectations;
  milestone jsonb;
  rule jsonb;
  milestone_id text;
  student_age integer;
  student_grade text;
begin
  select case when student.date_of_birth <= p_date then extract(year from age(p_date, student.date_of_birth))::integer else null end,
    case class_assignment.class_id when 'yk-a' then '8' when 'yk-b' then '7' else '' end
    into student_age, student_grade
    from public.students student left join public.student_class_assignments class_assignment on class_assignment.student_id = student.id
    where student.id = p_student_id;
  if not found then raise exception 'Student not found'; end if;
  select * into assignment from public.shachris_expectations
    where student_id = p_student_id and effective_date <= p_date
    order by effective_date desc, created_at desc, id desc limit 1;
  if assignment.mode = 'manual' then
    milestone_id := assignment.milestone_id;
  else
    select entry into rule from jsonb_array_elements(p_config->'rules') entry
      where (coalesce(entry->>'grade', '') = '' or entry->>'grade' = student_grade)
        and ((entry->>'minAge') is null or student_age >= (entry->>'minAge')::integer)
        and ((entry->>'maxAge') is null or student_age <= (entry->>'maxAge')::integer)
      limit 1;
    milestone_id := coalesce(rule->>'milestoneId', p_config->>'fallbackMilestoneId');
  end if;
  select entry into milestone from jsonb_array_elements(p_config->'milestones') entry where entry->>'id' = milestone_id;
  if milestone is null then raise exception 'Assigned milestone is missing. Review Rules & Settings.'; end if;
  return jsonb_build_object('milestoneId', milestone_id, 'label', milestone->>'label',
    'sectionIds', case when assignment.mode = 'manual' then coalesce(assignment.section_ids, milestone->'sectionIds') else milestone->'sectionIds' end,
    'source', case when assignment.mode = 'manual' then 'manual' else 'default' end);
end $$;
revoke all on function public.shachris_resolve_expectation(bigint, date, jsonb) from public, anon, authenticated;

create or replace function public.shachris_open_session(p_date date, p_student_ids bigint[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  session_row public.shachris_sessions;
  student_id_value bigint;
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
    for student_id_value in select distinct unnest(p_student_ids) order by 1 loop
      if not exists (select 1 from public.students where id = student_id_value and is_active is not false) then raise exception 'Student is not active'; end if;
      insert into public.shachris_student_records(session_id, student_id, expectation)
        values(session_row.id, student_id_value, public.shachris_resolve_expectation(student_id_value, p_date, session_row.config))
        on conflict (session_id, student_id) do nothing;
    end loop;
  end if;
  if session_row.id is null then raise exception 'No session exists on this date. An editor must open it first.'; end if;
  return jsonb_build_object('session', to_jsonb(session_row), 'records', coalesce((select jsonb_agg(to_jsonb(record) order by record.student_id) from public.shachris_student_records record where record.session_id = session_row.id and record.student_id = any(p_student_ids)), '[]'::jsonb));
end $$;

create or replace function public.shachris_save_records(p_session_id uuid, p_records jsonb, p_actor_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  incoming jsonb;
  existing public.shachris_student_records;
  session_config jsonb;
  saved jsonb := '[]'::jsonb;
  changed public.shachris_student_records;
begin
  if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Shachris editing denied'; end if;
  select config into session_config from public.shachris_sessions where id = p_session_id;
  if session_config is null then raise exception 'Session not found'; end if;
  if jsonb_typeof(p_records) <> 'array' then raise exception 'Invalid records'; end if;
  for incoming in select entry from jsonb_array_elements(p_records) entry order by (entry->>'student_id')::bigint loop
    select * into existing from public.shachris_student_records where session_id = p_session_id and student_id = (incoming->>'student_id')::bigint for update;
    if existing.student_id is null then raise exception 'Open the student session before saving'; end if;
    if existing.revision is distinct from (incoming->>'revision')::integer then raise exception 'Another staff member changed this session. Reload before saving.'; end if;
    if jsonb_typeof(incoming->'said_section_ids') <> 'array' or exists (
      select 1 from jsonb_array_elements_text(incoming->'said_section_ids') section_id
      where not exists (select 1 from jsonb_array_elements(session_config->'sections') section where section->>'id' = section_id)
    ) then raise exception 'Invalid section'; end if;
    if coalesce(incoming->>'rating_id', '') <> '' and not exists (select 1 from jsonb_array_elements(session_config->'ratings') rating where rating->>'id' = incoming->>'rating_id') then raise exception 'Invalid rating'; end if;
    update public.shachris_student_records set presence = incoming->>'presence', said_section_ids = incoming->'said_section_ids',
      rating_id = coalesce(incoming->>'rating_id', ''), note = coalesce(incoming->>'note', ''), revision = revision + 1,
      updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
      where session_id = p_session_id and student_id = existing.student_id returning * into changed;
    if existing.presence <> changed.presence then
      insert into public.shachris_events(session_id, student_id, event_type, detail, actor_name)
        values(p_session_id, existing.student_id, 'presence', jsonb_build_object('from', existing.presence, 'to', changed.presence), p_actor_name);
    end if;
    saved := saved || jsonb_build_array(to_jsonb(changed));
  end loop;
  return saved;
end $$;

create or replace function public.shachris_set_expectation(p_student_id bigint, p_mode text, p_milestone_id text, p_section_ids jsonb, p_reason text, p_actor_name text, p_effective_date date, p_session_id uuid, p_record_revision integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  config_value jsonb;
  session_row public.shachris_sessions;
  record_row public.shachris_student_records;
  assignment_row public.shachris_expectations;
begin
  if not public.dashboard_has_permission('attendance', 'edit') then raise exception 'Expectation editing denied'; end if;
  perform 1 from public.students where id = p_student_id and is_active is not false for update;
  if not found then raise exception 'Student is not active'; end if;
  select * into session_row from public.shachris_sessions where id = p_session_id;
  if session_row.session_date <> p_effective_date or session_row.id is null then raise exception 'The expectation date must match the open session'; end if;
  select * into record_row from public.shachris_student_records where session_id = p_session_id and student_id = p_student_id for update;
  if record_row.revision is distinct from p_record_revision then raise exception 'Another staff member changed this student. Reload before changing expectations.'; end if;
  select config into config_value from public.shachris_settings;
  if p_mode = 'manual' then
    if not exists (select 1 from jsonb_array_elements(config_value->'milestones') milestone where milestone->>'id' = p_milestone_id)
      or not exists (select 1 from jsonb_array_elements(session_row.config->'milestones') milestone where milestone->>'id' = p_milestone_id) then raise exception 'This milestone is not available in the current session'; end if;
    if p_section_ids is not null and (jsonb_typeof(p_section_ids) <> 'array' or jsonb_array_length(p_section_ids) = 0 or exists (
      select 1 from jsonb_array_elements_text(p_section_ids) section_id where not exists (select 1 from jsonb_array_elements(session_row.config->'sections') section where section->>'id' = section_id)
    )) then raise exception 'Choose at least one valid section'; end if;
  end if;
  insert into public.shachris_expectations(student_id, mode, milestone_id, section_ids, reason, actor_name, effective_date)
    values(p_student_id, p_mode, case when p_mode = 'manual' then p_milestone_id else null end, case when p_mode = 'manual' then p_section_ids else null end, p_reason, p_actor_name, p_effective_date)
    returning * into assignment_row;
  update public.shachris_student_records set expectation = public.shachris_resolve_expectation(p_student_id, p_effective_date, session_row.config),
    revision = revision + 1, updated_by = auth.uid(), updated_by_name = p_actor_name, updated_at = clock_timestamp()
    where session_id = p_session_id and student_id = p_student_id returning * into record_row;
  return jsonb_build_object('assignment', to_jsonb(assignment_row), 'record', to_jsonb(record_row));
end $$;

create or replace function public.shachris_save_settings(p_config jsonb, p_revision integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  settings_row public.shachris_settings;
begin
  if not public.dashboard_is_admin() or not public.dashboard_has_permission('setup', 'edit') then raise exception 'Only leadership can change Shachris settings'; end if;
  select * into settings_row from public.shachris_settings for update;
  if settings_row.revision is distinct from p_revision then raise exception 'Settings changed elsewhere. Reload before saving.'; end if;
  if jsonb_typeof(p_config->'sections') is distinct from 'array' or jsonb_typeof(p_config->'milestones') is distinct from 'array'
    or jsonb_typeof(p_config->'ratings') is distinct from 'array' or jsonb_typeof(p_config->'rules') is distinct from 'array'
    or jsonb_array_length(p_config->'sections') = 0 or jsonb_array_length(p_config->'milestones') = 0 then raise exception 'Invalid Shachris settings'; end if;
  if exists (select 1 from jsonb_array_elements(settings_row.config->'sections') prior where not exists (select 1 from jsonb_array_elements(p_config->'sections') next where next->>'id' = prior->>'id'))
    or exists (select 1 from jsonb_array_elements(settings_row.config->'milestones') prior where not exists (select 1 from jsonb_array_elements(p_config->'milestones') next where next->>'id' = prior->>'id')) then raise exception 'Existing section and milestone IDs must be preserved'; end if;
  update public.shachris_settings set config = p_config, revision = revision + 1, updated_by = auth.uid(), updated_at = clock_timestamp() returning * into settings_row;
  return to_jsonb(settings_row);
end $$;

revoke all on function public.shachris_open_session(date, bigint[]), public.shachris_save_records(uuid, jsonb, text), public.shachris_set_expectation(bigint, text, text, jsonb, text, text, date, uuid, integer), public.shachris_save_settings(jsonb, integer) from public, anon;
grant execute on function public.shachris_open_session(date, bigint[]), public.shachris_save_records(uuid, jsonb, text), public.shachris_set_expectation(bigint, text, text, jsonb, text, text, date, uuid, integer), public.shachris_save_settings(jsonb, integer) to authenticated;

notify pgrst, 'reload schema';
commit;