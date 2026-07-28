begin;

alter table public.store_redemptions
  add column if not exists idempotency_key text,
  add column if not exists points_event_id bigint references public.points_events(id),
  add column if not exists resulting_balance integer,
  add column if not exists resulting_stock integer,
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by text,
  add column if not exists reversal_event_id bigint references public.points_events(id),
  add column if not exists reversal_note text;

create unique index if not exists store_redemptions_idempotency_key_uidx
  on public.store_redemptions (idempotency_key)
  where idempotency_key is not null;

do $$
declare
  v_conflict record;
begin
  select
    points_event_id,
    count(*) as duplicate_count
  into v_conflict
  from public.store_redemptions
  where points_event_id is not null
  group by points_event_id
  having count(*) > 1
  limit 1;

  if found then
    raise exception 'Cannot enforce unique points_event_id on store_redemptions: points_event_id % appears % times.',
      v_conflict.points_event_id,
      v_conflict.duplicate_count;
  end if;
end;
$$;

create unique index if not exists store_redemptions_points_event_id_uidx
  on public.store_redemptions (points_event_id)
  where points_event_id is not null;

create index if not exists store_redemptions_points_event_id_idx
  on public.store_redemptions (points_event_id)
  where points_event_id is not null;

create unique index if not exists points_events_reversal_related_event_uidx
  on public.points_events (related_event_id)
  where related_event_id is not null
    and event_type = 'reversal';

create or replace function public.apply_points_event_tx(
  p_student_id bigint,
  p_points_delta integer,
  p_staff_name text,
  p_staff_role text default 'staff',
  p_event_type text default 'adjustment',
  p_category text default 'admin',
  p_reason text default 'Adjustment',
  p_note text default null,
  p_source_page text default null,
  p_source_context text default null,
  p_related_event_id bigint default null,
  p_metadata jsonb default '{}'::jsonb,
  p_reminder_delta integer default 0,
  p_student_name text default null,
  p_staff_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students%rowtype;
  v_event_id bigint;
  v_student_name text;
  v_next_points integer;
  v_next_reminders integer;
  v_metadata jsonb;
begin
  select *
  into v_student
  from public.students
  where id = p_student_id
  for update;

  if not found then
    raise exception 'Student % was not found.', p_student_id;
  end if;

  v_student_name := coalesce(nullif(trim(p_student_name), ''), nullif(trim(v_student.name), ''), 'Unknown Student');
  v_next_points := greatest(0, coalesce(v_student.token_balance, 0) + coalesce(p_points_delta, 0));
  v_next_reminders := greatest(0, coalesce(v_student.reminders, 0) + coalesce(p_reminder_delta, 0));
  v_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('reminderDelta', coalesce(p_reminder_delta, 0));

  insert into public.points_events (
    student_id,
    student_name,
    staff_id,
    staff_name,
    staff_role,
    points_delta,
    event_type,
    category,
    reason,
    note,
    source_page,
    source_context,
    related_event_id,
    metadata
  ) values (
    p_student_id,
    v_student_name,
    p_staff_id,
    coalesce(nullif(trim(p_staff_name), ''), 'Staff'),
    coalesce(nullif(trim(p_staff_role), ''), 'staff'),
    coalesce(p_points_delta, 0),
    coalesce(nullif(trim(p_event_type), ''), 'adjustment'),
    coalesce(nullif(trim(p_category), ''), 'admin'),
    coalesce(nullif(trim(p_reason), ''), 'Adjustment'),
    p_note,
    p_source_page,
    p_source_context,
    p_related_event_id,
    v_metadata
  )
  returning id into v_event_id;

  update public.students
  set token_balance = v_next_points,
      reminders = v_next_reminders
  where id = p_student_id;

  return jsonb_build_object(
    'event_id', v_event_id,
    'student_id', p_student_id,
    'next_points', v_next_points,
    'next_reminders', v_next_reminders
  );
end;
$$;

create or replace function public.redeem_store_purchase_tx(
  p_student_id bigint,
  p_item_id bigint,
  p_staff_name text,
  p_staff_role text default 'staff',
  p_idempotency_key text default null,
  p_source text default 'token-store',
  p_metadata jsonb default '{}'::jsonb,
  p_reason text default null,
  p_note text default null,
  p_source_page text default 'store',
  p_source_context text default 'token-store-redeem'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.store_redemptions%rowtype;
  v_student public.students%rowtype;
  v_item public.store_items%rowtype;
  v_event_id bigint;
  v_redemption_id bigint;
  v_next_points integer;
  v_next_stock integer;
  v_reason text;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key is required.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  select *
  into v_existing
  from public.store_redemptions
  where idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return jsonb_build_object(
      'status', 'duplicate_completed',
      'redemption_id', v_existing.id,
      'points_event_id', v_existing.points_event_id,
      'next_points', v_existing.resulting_balance,
      'next_stock', v_existing.resulting_stock,
      'student_id', v_existing.student_id,
      'item_id', v_existing.item_id
    );
  end if;

  select *
  into v_student
  from public.students
  where id = p_student_id
  for update;

  if not found then
    raise exception 'Student % was not found.', p_student_id;
  end if;

  select *
  into v_item
  from public.store_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Store item % was not found.', p_item_id;
  end if;

  if coalesce(v_item.active, false) is false then
    raise exception 'Store item % is inactive.', p_item_id;
  end if;

  if coalesce(v_item.stock, 0) <= 0 then
    raise exception '% is out of stock.', v_item.name;
  end if;

  if coalesce(v_student.token_balance, 0) < coalesce(v_item.cost, 0) then
    raise exception '% does not have enough points.', coalesce(v_student.name, 'Student');
  end if;

  v_next_points := greatest(0, coalesce(v_student.token_balance, 0) - coalesce(v_item.cost, 0));
  v_next_stock := coalesce(v_item.stock, 0) - 1;
  v_reason := coalesce(nullif(trim(p_reason), ''), format('Store purchase: %s', coalesce(v_item.name, 'Item')));

  insert into public.points_events (
    student_id,
    student_name,
    staff_id,
    staff_name,
    staff_role,
    points_delta,
    event_type,
    category,
    reason,
    note,
    source_page,
    source_context,
    metadata
  ) values (
    v_student.id,
    coalesce(v_student.name, 'Unknown Student'),
    null,
    coalesce(nullif(trim(p_staff_name), ''), 'Register'),
    coalesce(nullif(trim(p_staff_role), ''), 'staff'),
    -coalesce(v_item.cost, 0),
    'purchase',
    'store',
    v_reason,
    p_note,
    p_source_page,
    p_source_context,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('itemId', v_item.id, 'itemName', v_item.name, 'itemCost', v_item.cost, 'idempotencyKey', p_idempotency_key, 'reminderDelta', 0)
  )
  returning id into v_event_id;

  update public.students
  set token_balance = v_next_points
  where id = v_student.id;

  update public.store_items
  set stock = v_next_stock,
      updated_by = coalesce(nullif(trim(p_staff_name), ''), 'Register'),
      updated_at = now()
  where id = v_item.id;

  begin
    insert into public.store_redemptions (
      student_id,
      student_name,
      item_id,
      item_name,
      cost,
      staff_name,
      source,
      metadata,
      idempotency_key,
      points_event_id,
      resulting_balance,
      resulting_stock
    ) values (
      v_student.id,
      coalesce(v_student.name, 'Unknown Student'),
      v_item.id,
      coalesce(v_item.name, 'Unknown Item'),
      coalesce(v_item.cost, 0),
      coalesce(nullif(trim(p_staff_name), ''), 'Register'),
      coalesce(nullif(trim(p_source), ''), 'token-store'),
      coalesce(p_metadata, '{}'::jsonb),
      p_idempotency_key,
      v_event_id,
      v_next_points,
      v_next_stock
    )
    returning id into v_redemption_id;
  exception
    when unique_violation then
      select *
      into v_existing
      from public.store_redemptions
      where idempotency_key = p_idempotency_key
      limit 1;

      if found then
        return jsonb_build_object(
          'status', 'duplicate_completed',
          'redemption_id', v_existing.id,
          'points_event_id', v_existing.points_event_id,
          'next_points', v_existing.resulting_balance,
          'next_stock', v_existing.resulting_stock,
          'student_id', v_existing.student_id,
          'item_id', v_existing.item_id
        );
      end if;

      raise exception 'Store redemption unique constraint violation occurred, but no completed idempotent row was found for key %.', p_idempotency_key;
  end;

  return jsonb_build_object(
    'status', 'created',
    'redemption_id', v_redemption_id,
    'points_event_id', v_event_id,
    'next_points', v_next_points,
    'next_stock', v_next_stock,
    'student_id', v_student.id,
    'item_id', v_item.id
  );
end;
$$;

create or replace function public.reverse_points_event_tx(
  p_target_event_id bigint,
  p_staff_name text,
  p_staff_role text default 'staff',
  p_note text default null,
  p_source_context text default 'history-undo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.points_events%rowtype;
  v_target_locked public.points_events%rowtype;
  v_student public.students%rowtype;
  v_original_reminder_delta integer;
  v_reversal_points_delta integer;
  v_reversal_reminder_delta integer;
  v_next_points integer;
  v_next_reminders integer;
  v_reversal_event_id bigint;
begin
  select *
  into v_target
  from public.points_events
  where id = p_target_event_id;

  if not found then
    raise exception 'Points event % was not found.', p_target_event_id;
  end if;

  if v_target.event_type = 'reversal' then
    raise exception 'Points event % is already a reversal event.', p_target_event_id;
  end if;

  if v_target.event_type = 'purchase' or v_target.category = 'store' then
    raise exception 'Store purchase events must be reversed with reverse_store_purchase_tx.';
  end if;

  if exists (
    select 1
    from public.points_events pe
    where pe.related_event_id = p_target_event_id
      and pe.event_type = 'reversal'
  ) then
    raise exception 'Points event % has already been reversed.', p_target_event_id;
  end if;

  select *
  into v_student
  from public.students
  where id = v_target.student_id
  for update;

  if not found then
    raise exception 'Student % was not found for points event %.', v_target.student_id, p_target_event_id;
  end if;

  select *
  into v_target_locked
  from public.points_events
  where id = p_target_event_id
  for update;

  if v_target_locked.event_type = 'reversal' then
    raise exception 'Points event % is already a reversal event.', p_target_event_id;
  end if;

  if exists (
    select 1
    from public.points_events pe
    where pe.related_event_id = p_target_event_id
      and pe.event_type = 'reversal'
  ) then
    raise exception 'Points event % has already been reversed.', p_target_event_id;
  end if;

  v_original_reminder_delta := coalesce((v_target_locked.metadata ->> 'reminderDelta')::integer, case when v_target_locked.event_type = 'reminder' then 1 else 0 end);
  v_reversal_points_delta := -coalesce(v_target_locked.points_delta, 0);
  v_reversal_reminder_delta := -v_original_reminder_delta;
  v_next_points := greatest(0, coalesce(v_student.token_balance, 0) + v_reversal_points_delta);
  v_next_reminders := greatest(0, coalesce(v_student.reminders, 0) + v_reversal_reminder_delta);

  insert into public.points_events (
    student_id,
    student_name,
    staff_id,
    staff_name,
    staff_role,
    points_delta,
    event_type,
    category,
    reason,
    note,
    source_page,
    source_context,
    related_event_id,
    metadata
  ) values (
    v_target_locked.student_id,
    coalesce(v_target_locked.student_name, v_student.name, 'Unknown Student'),
    null,
    coalesce(nullif(trim(p_staff_name), ''), 'Staff'),
    coalesce(nullif(trim(p_staff_role), ''), 'staff'),
    v_reversal_points_delta,
    'reversal',
    v_target_locked.category,
    format('Undo: %s', v_target_locked.reason),
    coalesce(p_note, format('Reversed event #%s', v_target_locked.id)),
    coalesce(v_target_locked.source_page, v_target_locked.category),
    coalesce(nullif(trim(p_source_context), ''), 'history-undo'),
    v_target_locked.id,
    jsonb_build_object(
      'reversedEventId', v_target_locked.id,
      'originalEventType', v_target_locked.event_type,
      'originalPointsDelta', coalesce(v_target_locked.points_delta, 0),
      'originalReminderDelta', v_original_reminder_delta,
      'reminderDelta', v_reversal_reminder_delta
    )
  )
  returning id into v_reversal_event_id;

  update public.students
  set token_balance = v_next_points,
      reminders = v_next_reminders
  where id = v_student.id;

  return jsonb_build_object(
    'status', 'reversed',
    'reversal_event_id', v_reversal_event_id,
    'target_event_id', v_target_locked.id,
    'student_id', v_student.id,
    'next_points', v_next_points,
    'next_reminders', v_next_reminders
  );
end;
$$;

create or replace function public.reverse_store_purchase_tx(
  p_target_points_event_id bigint,
  p_staff_name text,
  p_staff_role text default 'staff',
  p_note text default null,
  p_source_context text default 'history-undo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.store_redemptions%rowtype;
  v_redemption_locked public.store_redemptions%rowtype;
  v_original_event public.points_events%rowtype;
  v_original_event_locked public.points_events%rowtype;
  v_student public.students%rowtype;
  v_item public.store_items%rowtype;
  v_reversal_event_id bigint;
  v_next_points integer;
  v_next_stock integer;
  v_reversal_points_delta integer;
begin
  select *
  into v_redemption
  from public.store_redemptions
  where points_event_id = p_target_points_event_id
  limit 1;

  if not found then
    raise exception 'Store purchase reversal is unavailable for this historical purchase because it is not linked to a store_redemptions row.';
  end if;

  if v_redemption.points_event_id is null then
    raise exception 'Store purchase reversal is unavailable for this historical purchase because it is not linked to a points event.';
  end if;

  if v_redemption.reversed_at is not null then
    raise exception 'Store redemption % has already been reversed.', v_redemption.id;
  end if;

  if v_redemption.student_id is null or v_redemption.item_id is null then
    raise exception 'Store redemption % cannot be reversed because student/item references are missing.', v_redemption.id;
  end if;

  select *
  into v_student
  from public.students
  where id = v_redemption.student_id
  for update;

  if not found then
    raise exception 'Student % was not found for store redemption %.', v_redemption.student_id, v_redemption.id;
  end if;

  select *
  into v_item
  from public.store_items
  where id = v_redemption.item_id
  for update;

  if not found then
    raise exception 'Store item % was not found for store redemption %.', v_redemption.item_id, v_redemption.id;
  end if;

  select *
  into v_redemption_locked
  from public.store_redemptions
  where id = v_redemption.id
  for update;

  if v_redemption_locked.reversed_at is not null then
    raise exception 'Store redemption % has already been reversed.', v_redemption_locked.id;
  end if;

  select *
  into v_original_event
  from public.points_events
  where id = p_target_points_event_id;

  if not found then
    raise exception 'Original purchase points event % was not found.', p_target_points_event_id;
  end if;

  if v_original_event.event_type = 'reversal' then
    raise exception 'Points event % is already a reversal event.', p_target_points_event_id;
  end if;

  if exists (
    select 1
    from public.points_events pe
    where pe.related_event_id = p_target_points_event_id
      and pe.event_type = 'reversal'
  ) then
    raise exception 'Store purchase points event % has already been reversed.', p_target_points_event_id;
  end if;

  select *
  into v_original_event_locked
  from public.points_events
  where id = p_target_points_event_id
  for update;

  if exists (
    select 1
    from public.points_events pe
    where pe.related_event_id = p_target_points_event_id
      and pe.event_type = 'reversal'
  ) then
    raise exception 'Store purchase points event % has already been reversed.', p_target_points_event_id;
  end if;

  v_reversal_points_delta := -coalesce(v_original_event_locked.points_delta, 0);
  v_next_points := greatest(0, coalesce(v_student.token_balance, 0) + v_reversal_points_delta);
  v_next_stock := coalesce(v_item.stock, 0) + 1;

  insert into public.points_events (
    student_id,
    student_name,
    staff_id,
    staff_name,
    staff_role,
    points_delta,
    event_type,
    category,
    reason,
    note,
    source_page,
    source_context,
    related_event_id,
    metadata
  ) values (
    v_original_event_locked.student_id,
    coalesce(v_original_event_locked.student_name, v_student.name, 'Unknown Student'),
    null,
    coalesce(nullif(trim(p_staff_name), ''), 'Staff'),
    coalesce(nullif(trim(p_staff_role), ''), 'staff'),
    v_reversal_points_delta,
    'reversal',
    'store',
    format('Undo: %s', v_original_event_locked.reason),
    coalesce(p_note, format('Reversed store purchase event #%s', v_original_event_locked.id)),
    coalesce(v_original_event_locked.source_page, 'store'),
    coalesce(nullif(trim(p_source_context), ''), 'history-undo'),
    v_original_event_locked.id,
    jsonb_build_object(
      'reversedEventId', v_original_event_locked.id,
      'reversedRedemptionId', v_redemption_locked.id,
      'originalEventType', v_original_event_locked.event_type,
      'originalPointsDelta', coalesce(v_original_event_locked.points_delta, 0),
      'originalReminderDelta', 0,
      'reminderDelta', 0
    )
  )
  returning id into v_reversal_event_id;

  update public.students
  set token_balance = v_next_points
  where id = v_student.id;

  update public.store_items
  set stock = v_next_stock,
      updated_by = coalesce(nullif(trim(p_staff_name), ''), 'Staff'),
      updated_at = now()
  where id = v_item.id;

  update public.store_redemptions
  set reversed_at = now(),
      reversed_by = coalesce(nullif(trim(p_staff_name), ''), 'Staff'),
      reversal_event_id = v_reversal_event_id,
      reversal_note = p_note,
      resulting_balance = coalesce(resulting_balance, v_next_points),
      resulting_stock = coalesce(resulting_stock, v_next_stock)
  where id = v_redemption_locked.id;

  return jsonb_build_object(
    'status', 'reversed',
    'redemption_id', v_redemption_locked.id,
    'target_event_id', v_original_event_locked.id,
    'reversal_event_id', v_reversal_event_id,
    'student_id', v_student.id,
    'item_id', v_item.id,
    'next_points', v_next_points,
    'next_stock', v_next_stock
  );
end;
$$;

revoke all on function public.apply_points_event_tx(
  bigint,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  bigint,
  jsonb,
  integer,
  text,
  text
) from public;

grant execute on function public.apply_points_event_tx(
  bigint,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  bigint,
  jsonb,
  integer,
  text,
  text
) to anon, authenticated, service_role;

revoke all on function public.redeem_store_purchase_tx(
  bigint,
  bigint,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.redeem_store_purchase_tx(
  bigint,
  bigint,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  text
) to anon, authenticated, service_role;

revoke all on function public.reverse_points_event_tx(
  bigint,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.reverse_points_event_tx(
  bigint,
  text,
  text,
  text,
  text
) to anon, authenticated, service_role;

revoke all on function public.reverse_store_purchase_tx(
  bigint,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.reverse_store_purchase_tx(
  bigint,
  text,
  text,
  text,
  text
) to anon, authenticated, service_role;

commit;