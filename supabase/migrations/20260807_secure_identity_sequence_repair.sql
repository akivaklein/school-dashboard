begin;

do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.students', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.students), 0) + 1, false)',
      seq_name
    );
  end if;

  select pg_get_serial_sequence('public.store_items', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.store_items), 0) + 1, false)',
      seq_name
    );
  end if;

  select pg_get_serial_sequence('public.points_events', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.points_events), 0) + 1, false)',
      seq_name
    );
  end if;

  select pg_get_serial_sequence('public.store_redemptions', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.store_redemptions), 0) + 1, false)',
      seq_name
    );
  end if;

  select pg_get_serial_sequence('public.audit_logs', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.audit_logs), 0) + 1, false)',
      seq_name
    );
  end if;
end
$$;

commit;