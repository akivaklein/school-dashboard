begin;

alter table public.student_task_email_deliveries
  add column if not exists channel text not null default 'email';

alter table public.student_task_email_deliveries
  drop constraint if exists student_task_email_deliveries_channel_check;

alter table public.student_task_email_deliveries
  add constraint student_task_email_deliveries_channel_check
  check (channel in ('email', 'sms'));

alter table public.student_task_email_deliveries
  drop constraint if exists student_task_email_deliveries_task_id_notification_cycle_key;

create unique index if not exists student_task_delivery_task_cycle_channel_uidx
  on public.student_task_email_deliveries (task_id, notification_cycle, channel);

create or replace function public.claim_student_task_delivery(
  p_task_id uuid,
  p_notification_cycle uuid,
  p_channel text,
  p_recipient text,
  p_sender text,
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
  if p_channel not in ('email', 'sms') then
    raise exception 'Unsupported delivery channel';
  end if;

  insert into public.student_task_email_deliveries (
    task_id, notification_cycle, channel, recipient_email, sender_email,
    scheduled_for, status, attempt_count, claimed_at
  ) values (
    p_task_id, p_notification_cycle, p_channel, p_recipient, p_sender,
    p_scheduled_for, 'pending', 1, timezone('utc', now())
  )
  on conflict (task_id, notification_cycle, channel) do update
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

revoke all on function public.claim_student_task_delivery(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_student_task_delivery(uuid, uuid, text, text, text, timestamptz) to service_role;

create or replace function public.claim_student_task_email_delivery(
  p_task_id uuid,
  p_notification_cycle uuid,
  p_recipient_email text,
  p_sender_email text,
  p_scheduled_for timestamptz
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.claim_student_task_delivery(
    p_task_id,
    p_notification_cycle,
    'email',
    p_recipient_email,
    p_sender_email,
    p_scheduled_for
  );
$$;

commit;
