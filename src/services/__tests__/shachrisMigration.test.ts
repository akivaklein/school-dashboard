import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { INITIAL_SHACHRIS_CONFIG } from '../../utils/shachris'

const migration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261005_shachris_checkpoint.sql'), 'utf8')
const dobImport = readFileSync(path.resolve(__dirname, '../../../docs/20261005_shachris_dob_import.sql'), 'utf8')

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
  it('retains temporary changes but excludes them from future expectation resolution', () => {
    expect(migration).toContain("duration text not null check (duration in ('today', 'future'))")
    expect(migration).toContain("and (duration = 'future' or effective_date = p_date)")
    expect(migration).toContain('p_duration text')
  })
  it('blocks DOB import until 16 reviewed entries and unique active matches are available', () => {
    expect(dobImport).toContain('(select count(*) from shachris_dob_input) <> 16')
    expect(dobImport).toContain('(select count(distinct id) from shachris_dob_matches) <> 16')
    expect(dobImport).toContain('having count(matched.id) <> 1')
    expect(dobImport).toContain('student.date_of_birth is not null and student.date_of_birth <> matched.dob')
    expect(dobImport).toContain('student.date_of_birth is null')
    expect(dobImport.indexOf('exactly 16 reviewed DOBs')).toBeLessThan(dobImport.indexOf('create temporary table shachris_dob_matches'))
  })
})