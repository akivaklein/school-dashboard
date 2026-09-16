begin;

alter table public.student_tasks
  add column if not exists notification_cycle uuid not null default gen_random_uuid();

create index if not exists student_tasks_email_ready_idx
  on public.student_tasks (notification_cycle, reminder_start_at, snoozed_until)
  where completed_at is null and notification_preference in ('email', 'email_text');

create table if not exists public.student_task_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.student_tasks(id) on delete cascade,
  notification_cycle uuid not null,
  recipient_email text not null,
  sender_email text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  attempt_count integer not null default 0,
  last_error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (task_id, notification_cycle)
);

create index if not exists student_task_email_deliveries_status_idx
  on public.student_task_email_deliveries (status, scheduled_for);
create index if not exists student_task_email_deliveries_task_idx
  on public.student_task_email_deliveries (task_id, created_at desc);

create or replace function public.student_task_email_deliveries_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_student_task_email_deliveries_set_updated_at on public.student_task_email_deliveries;
create trigger trg_student_task_email_deliveries_set_updated_at
before update on public.student_task_email_deliveries
for each row execute function public.student_task_email_deliveries_set_updated_at();

alter table public.student_task_email_deliveries enable row level security;
revoke all on table public.student_task_email_deliveries from anon, authenticated;

drop policy if exists student_task_email_deliveries_no_browser_access on public.student_task_email_deliveries;

create or replace function public.claim_student_task_email_delivery(
  p_task_id uuid,
  p_notification_cycle uuid,
  p_recipient_email text,
  p_sender_email text,
  p_scheduled_for timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  insert into public.student_task_email_deliveries (
    task_id,
    notification_cycle,
    recipient_email,
    sender_email,
    scheduled_for,
    status,
    attempt_count,
    claimed_at
  ) values (
    p_task_id,
    p_notification_cycle,
    p_recipient_email,
    p_sender_email,
    p_scheduled_for,
    'pending',
    1,
    timezone('utc', now())
  )
  on conflict (task_id, notification_cycle) do update
    set status = 'pending',
        recipient_email = excluded.recipient_email,
        sender_email = excluded.sender_email,
        scheduled_for = excluded.scheduled_for,
        attempt_count = public.student_task_email_deliveries.attempt_count + 1,
        claimed_at = timezone('utc', now()),
        last_error = null,
        updated_at = timezone('utc', now())
    where public.student_task_email_deliveries.status = 'failed'
       or (
         public.student_task_email_deliveries.status = 'pending'
         and public.student_task_email_deliveries.claimed_at < timezone('utc', now()) - interval '10 minutes'
       )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_student_task_email_delivery(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_student_task_email_delivery(uuid, uuid, text, text, timestamptz) to service_role;

commit;
