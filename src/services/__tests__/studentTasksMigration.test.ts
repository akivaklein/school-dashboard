import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260916_create_student_tasks.sql'),
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
})
