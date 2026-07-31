import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationPath = '../../../supabase/migrations/20260731_add_support_and_notes_tables.sql'
const migrationSql = readFileSync(new URL(migrationPath, import.meta.url), 'utf8')

describe('persistence migration coverage', () => {
  it('creates support session and student note tables with the expected columns', () => {
    expect(migrationSql).toContain('create table if not exists public.support_sessions')
    expect(migrationSql).toContain('student_id bigint references public.students(id)')
    expect(migrationSql).toContain('service_type text not null')
    expect(migrationSql).toContain('return_location text')
    expect(migrationSql).toContain('create table if not exists public.student_notes')
    expect(migrationSql).toContain('student_name text not null')
    expect(migrationSql).toContain('note text not null')
    expect(migrationSql).toContain('author text not null')
  })
})
