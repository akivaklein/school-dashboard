import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/20260916_add_davening_progress.sql'),
  'utf8',
)

const templateTable = migration.slice(
  migration.indexOf('create table if not exists public.davening_templates'),
  migration.indexOf('create table if not exists public.davening_checklists'),
)

describe('Davening progress schema', () => {
  it('keeps templates independent from student rosters', () => {
    expect(templateTable).not.toContain('student_id')
    expect(templateTable).not.toContain('roster')
    expect(templateTable).toContain('sections jsonb')
    expect(templateTable).toContain('ratings jsonb')
  })

  it('stores dated checklists and marks outside attendance, academics, and behavior', () => {
    expect(migration).toContain('create table if not exists public.davening_checklists')
    expect(migration).toContain('create table if not exists public.davening_marks')
    expect(migration).toContain('unique (template_id, checklist_date, scope_type, scope_id)')
    expect(migration).toContain('primary key (checklist_id, student_id, section_id)')
  })

  it('allows authenticated access while revoking anonymous access', () => {
    for (const table of ['davening_templates', 'davening_checklists', 'davening_marks']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
      expect(migration).toContain(`revoke all on table public.${table} from anon`)
    }
  })
})
