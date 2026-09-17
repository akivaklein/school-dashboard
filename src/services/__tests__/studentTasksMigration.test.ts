import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260916_create_student_tasks.sql'),
  'utf8',
)
const phase2Migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260916_extend_student_tasks_phase2.sql'),
  'utf8',
)
const phase3Migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260916_student_task_email_delivery.sql'),
  'utf8',
)
const smsMigration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260917_student_task_sms_delivery.sql'),
  'utf8',
)
const recurrenceDurabilityMigration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260917_student_task_recurrence_durability.sql'),
  'utf8',
)

describe('student tasks schema', () => {
  it('uses a dedicated table with preserved completion history', () => {
    expect(migration).toContain('create table if not exists public.student_tasks')
    expect(migration).toContain('completed_at timestamptz')
    expect(migration).toContain('completed_by text')
    expect(migration).toContain("check (repeat_type in ('one_time', 'daily_until_done'))")
  })

  it('restricts access to authenticated staff through RLS', () => {
    expect(migration).toContain('alter table public.student_tasks enable row level security')
    expect(migration).toContain('revoke all on table public.student_tasks from anon')
    expect(migration).toContain('to authenticated')
  })

  it('adds reminder timing, snooze history, and recurring occurrence fields additively', () => {
    expect(phase2Migration).toContain('add column if not exists reminder_start_at')
    expect(phase2Migration).toContain('add column if not exists recurrence_days')
    expect(phase2Migration).toContain('create table if not exists public.student_task_snoozes')
    expect(phase2Migration).toContain("'specific_days'")
    expect(phase2Migration).not.toContain('drop table')
  })

  it('adds server-side email delivery tracking without browser access', () => {
    expect(phase3Migration).toContain('add column if not exists notification_cycle')
    expect(phase3Migration).toContain('create table if not exists public.student_task_email_deliveries')
    expect(phase3Migration).toContain('unique (task_id, notification_cycle)')
    expect(phase3Migration).toContain('revoke all on table public.student_task_email_deliveries from anon, authenticated')
    expect(phase3Migration).toContain('claim_student_task_email_delivery')
  })

  it('adds channel-aware SMS delivery without replacing email history', () => {
    expect(smsMigration).toContain("add column if not exists channel text not null default 'email'")
    expect(smsMigration).toContain("check (channel in ('email', 'sms'))")
    expect(smsMigration).toContain('student_task_delivery_task_cycle_channel_uidx')
    expect(smsMigration).toContain('claim_student_task_delivery')
  })

  it('adds skip and recurrence-cancellation history without touching completion history', () => {
    expect(recurrenceDurabilityMigration).toContain('add column if not exists skipped_at')
    expect(recurrenceDurabilityMigration).toContain('add column if not exists skipped_by')
    expect(recurrenceDurabilityMigration).toContain('add column if not exists recurrence_canceled_at')
    expect(recurrenceDurabilityMigration).toContain('add column if not exists recurrence_canceled_by')
    expect(recurrenceDurabilityMigration).not.toContain('drop table')
    expect(recurrenceDurabilityMigration).not.toContain('completed_at')
  })

  it('makes duplicate occurrence creation impossible so client and server catch-up cannot double-create', () => {
    expect(recurrenceDurabilityMigration).toContain('create unique index student_tasks_series_occurrence_unique_idx')
    expect(recurrenceDurabilityMigration).toContain('on public.student_tasks (series_id, occurrence_number)')
  })

  it('exposes only the series tip through a service-role-only view for server-side catch-up', () => {
    expect(recurrenceDurabilityMigration).toContain('create or replace view public.student_task_series_tips')
    expect(recurrenceDurabilityMigration).toContain('order by series_id, occurrence_number desc')
    expect(recurrenceDurabilityMigration).toContain('revoke all on public.student_task_series_tips from anon, authenticated')
    expect(recurrenceDurabilityMigration).toContain('grant select on public.student_task_series_tips to service_role')
  })
})
