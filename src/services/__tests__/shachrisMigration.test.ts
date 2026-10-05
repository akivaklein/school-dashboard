import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { INITIAL_SHACHRIS_CONFIG } from '../../utils/shachris'

const migration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261005_shachris_checkpoint.sql'), 'utf8')

describe('Shachris additive foundation', () => {
  it('adds DOB without updating existing students or legacy Davening records', () => {
    expect(migration).toContain('add column if not exists date_of_birth date')
    expect(migration).not.toMatch(/(?:update|delete from|drop table|truncate) public\.(?:students|davening_|staff)/i)
  })
  it('keeps SQL and client initial configuration identical', () => {
    const seed = migration.match(/values \('([\s\S]*?)'::jsonb\)/)?.[1]
    expect(JSON.parse(seed || '{}')).toEqual(INITIAL_SHACHRIS_CONFIG)
  })
  it('uses explicit RPCs, authenticated permissions, unique days and student snapshots', () => {
    expect(migration).toContain('session_date date not null unique')
    expect(migration).toContain('primary key (session_id, student_id)')
    expect(migration).toContain('expectation jsonb not null')
    expect(migration).toContain("dashboard_has_permission('attendance', 'edit')")
    expect(migration).toContain('Another staff member changed this session')
    for (const table of ['settings', 'expectations', 'sessions', 'student_records', 'events']) {
      expect(migration).toContain(`alter table public.shachris_${table} enable row level security`)
    }
  })
})