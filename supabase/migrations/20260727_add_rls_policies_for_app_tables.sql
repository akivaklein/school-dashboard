begin;

alter table public.store_items enable row level security;
alter table public.store_redemptions enable row level security;
alter table public.staff enable row level security;
alter table public.student_flags enable row level security;
alter table public.todos enable row level security;
alter table public.login_sessions enable row level security;
alter table public.teaching_actions enable row level security;
alter table public.vip_rules enable row level security;
alter table public.store_sales enable row level security;
alter table public.setup_assignments enable row level security;
alter table public.therapy_schedule enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.setup_center_config enable row level security;

drop policy if exists store_items_select_authenticated on public.store_items;
drop policy if exists store_items_insert_admin on public.store_items;
drop policy if exists store_items_update_admin on public.store_items;
drop policy if exists store_items_delete_admin on public.store_items;

drop policy if exists store_redemptions_select_authenticated on public.store_redemptions;
drop policy if exists store_redemptions_insert_staff on public.store_redemptions;
drop policy if exists store_redemptions_update_admin on public.store_redemptions;
drop policy if exists store_redemptions_delete_admin on public.store_redemptions;

drop policy if exists staff_select_authenticated on public.staff;
drop policy if exists staff_insert_admin on public.staff;
drop policy if exists staff_update_admin on public.staff;
drop policy if exists staff_delete_admin on public.staff;

drop policy if exists student_flags_select_authenticated on public.student_flags;
drop policy if exists student_flags_insert_staff on public.student_flags;
drop policy if exists student_flags_update_staff on public.student_flags;
drop policy if exists student_flags_delete_admin on public.student_flags;

drop policy if exists todos_select_authenticated on public.todos;
drop policy if exists todos_insert_staff on public.todos;
drop policy if exists todos_update_staff on public.todos;
drop policy if exists todos_delete_admin on public.todos;

drop policy if exists login_sessions_select_authenticated on public.login_sessions;
drop policy if exists login_sessions_insert_admin on public.login_sessions;
drop policy if exists login_sessions_update_admin on public.login_sessions;
drop policy if exists login_sessions_delete_admin on public.login_sessions;

drop policy if exists teaching_actions_select_admin on public.teaching_actions;
drop policy if exists teaching_actions_insert_admin on public.teaching_actions;
drop policy if exists teaching_actions_update_admin on public.teaching_actions;
drop policy if exists teaching_actions_delete_admin on public.teaching_actions;

drop policy if exists vip_rules_select_admin on public.vip_rules;
drop policy if exists vip_rules_insert_admin on public.vip_rules;
drop policy if exists vip_rules_update_admin on public.vip_rules;
drop policy if exists vip_rules_delete_admin on public.vip_rules;

drop policy if exists store_sales_select_admin on public.store_sales;
drop policy if exists store_sales_insert_admin on public.store_sales;
drop policy if exists store_sales_update_admin on public.store_sales;
drop policy if exists store_sales_delete_admin on public.store_sales;

drop policy if exists setup_assignments_select_admin on public.setup_assignments;
drop policy if exists setup_assignments_insert_admin on public.setup_assignments;
drop policy if exists setup_assignments_update_admin on public.setup_assignments;
drop policy if exists setup_assignments_delete_admin on public.setup_assignments;

drop policy if exists therapy_schedule_select_admin on public.therapy_schedule;
drop policy if exists therapy_schedule_insert_admin on public.therapy_schedule;
drop policy if exists therapy_schedule_update_admin on public.therapy_schedule;
drop policy if exists therapy_schedule_delete_admin on public.therapy_schedule;

drop policy if exists staff_accounts_select_admin on public.staff_accounts;
drop policy if exists staff_accounts_insert_admin on public.staff_accounts;
drop policy if exists staff_accounts_update_admin on public.staff_accounts;
drop policy if exists staff_accounts_delete_admin on public.staff_accounts;

drop policy if exists setup_center_config_select_admin on public.setup_center_config;
drop policy if exists setup_center_config_insert_admin on public.setup_center_config;
drop policy if exists setup_center_config_update_admin on public.setup_center_config;
drop policy if exists setup_center_config_delete_admin on public.setup_center_config;

create policy store_items_select_authenticated
on public.store_items
for select
to authenticated
using (true);

create policy store_items_insert_admin
on public.store_items
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_items_update_admin
on public.store_items
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_items_delete_admin
on public.store_items
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_redemptions_select_authenticated
on public.store_redemptions
for select
to authenticated
using (true);

create policy store_redemptions_insert_staff
on public.store_redemptions
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

create policy store_redemptions_update_admin
on public.store_redemptions
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_redemptions_delete_admin
on public.store_redemptions
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_select_authenticated
on public.staff
for select
to authenticated
using (true);

create policy staff_insert_admin
on public.staff
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_update_admin
on public.staff
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_delete_admin
on public.staff
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy student_flags_select_authenticated
on public.student_flags
for select
to authenticated
using (true);

create policy student_flags_insert_staff
on public.student_flags
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

create policy student_flags_update_staff
on public.student_flags
for update
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
)
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

create policy student_flags_delete_admin
on public.student_flags
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy todos_select_authenticated
on public.todos
for select
to authenticated
using (true);

create policy todos_insert_staff
on public.todos
for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

create policy todos_update_staff
on public.todos
for update
to authenticated
using (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
)
with check (
  public.current_user_role() in (
    'admin'::public.user_role,
    'teacher'::public.user_role,
    'therapist'::public.user_role,
    'office'::public.user_role
  )
);

create policy todos_delete_admin
on public.todos
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy login_sessions_select_authenticated
on public.login_sessions
for select
to authenticated
using (true);

create policy login_sessions_insert_admin
on public.login_sessions
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy login_sessions_update_admin
on public.login_sessions
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy login_sessions_delete_admin
on public.login_sessions
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy teaching_actions_select_admin
on public.teaching_actions
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy teaching_actions_insert_admin
on public.teaching_actions
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy teaching_actions_update_admin
on public.teaching_actions
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy teaching_actions_delete_admin
on public.teaching_actions
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy vip_rules_select_admin
on public.vip_rules
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy vip_rules_insert_admin
on public.vip_rules
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy vip_rules_update_admin
on public.vip_rules
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy vip_rules_delete_admin
on public.vip_rules
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_sales_select_admin
on public.store_sales
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_sales_insert_admin
on public.store_sales
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_sales_update_admin
on public.store_sales
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy store_sales_delete_admin
on public.store_sales
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_assignments_select_admin
on public.setup_assignments
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_assignments_insert_admin
on public.setup_assignments
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_assignments_update_admin
on public.setup_assignments
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_assignments_delete_admin
on public.setup_assignments
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy therapy_schedule_select_admin
on public.therapy_schedule
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy therapy_schedule_insert_admin
on public.therapy_schedule
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy therapy_schedule_update_admin
on public.therapy_schedule
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy therapy_schedule_delete_admin
on public.therapy_schedule
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_accounts_select_admin
on public.staff_accounts
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_accounts_insert_admin
on public.staff_accounts
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_accounts_update_admin
on public.staff_accounts
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy staff_accounts_delete_admin
on public.staff_accounts
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_center_config_select_admin
on public.setup_center_config
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_center_config_insert_admin
on public.setup_center_config
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_center_config_update_admin
on public.setup_center_config
for update
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
)
with check (
  public.current_user_role() = 'admin'::public.user_role
);

create policy setup_center_config_delete_admin
on public.setup_center_config
for delete
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
);

commit;
