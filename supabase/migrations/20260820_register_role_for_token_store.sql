begin;

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'teacher', 'rebbe', 'support_staff', 'register'));

-- Keep the secure policy definitions compatible with the register role.
drop policy if exists points_events_insert_staff on public.points_events;
create policy points_events_insert_staff
on public.points_events
for insert
to authenticated
with check (
  public.dashboard_current_role() in ('admin', 'teacher', 'rebbe', 'support_staff', 'register')
);

drop policy if exists store_redemptions_insert_staff on public.store_redemptions;
create policy store_redemptions_insert_staff
on public.store_redemptions
for insert
to authenticated
with check (
  public.dashboard_current_role() in ('admin', 'teacher', 'rebbe', 'support_staff', 'register')
);

commit;
