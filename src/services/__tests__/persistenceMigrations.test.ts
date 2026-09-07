import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationPath = '../../../supabase/migrations/20260731_add_support_and_notes_tables.sql'
const migrationSql = readFileSync(new URL(migrationPath, import.meta.url), 'utf8')
const studentSupportMigrationPath = '../../../supabase/migrations/20260907_add_student_support_records.sql'
const studentSupportMigrationSql = readFileSync(new URL(studentSupportMigrationPath, import.meta.url), 'utf8')

describe('persistence migration coverage', () => {
  it('creates support session and student note tables with the expected columns and portal-safe RLS', () => {
    expect(migrationSql).toContain('create table if not exists public.support_sessions')
    expect(migrationSql).toContain('student_id bigint references public.students(id)')
    expect(migrationSql).toContain('service_type text not null')
    expect(migrationSql).toContain('return_location text')
    expect(migrationSql).toContain('create table if not exists public.student_notes')
    expect(migrationSql).toContain('student_name text not null')
    expect(migrationSql).toContain('note text not null')
    expect(migrationSql).toContain('author text not null')
    expect(migrationSql).toContain('alter table public.support_sessions enable row level security')
    expect(migrationSql).toContain('alter table public.student_notes enable row level security')
    expect(migrationSql).toContain('grant select, insert, update, delete on table public.support_sessions to anon, authenticated')
    expect(migrationSql).toContain('create policy support_sessions_select_portal')
    expect(migrationSql).toContain('alter publication supabase_realtime add table public.support_sessions')
  })

  it('keeps student goal access authenticated and dashboard-role scoped', () => {
    expect(studentSupportMigrationSql).toContain('create table if not exists public.student_goals')
    expect(studentSupportMigrationSql).toContain('revoke all on table public.student_goals from anon')
    expect(studentSupportMigrationSql).toContain('grant select, insert, update, delete on table public.student_goals to authenticated')
    expect(studentSupportMigrationSql).toContain('public.dashboard_is_leadership()')
    expect(studentSupportMigrationSql).toContain("public.dashboard_current_role() in ('teacher', 'rebbe')")
    expect(studentSupportMigrationSql).toContain("public.dashboard_current_role() = 'support_staff'")
    expect(studentSupportMigrationSql).not.toContain('to anon, authenticated')
    expect(studentSupportMigrationSql).not.toContain('using (true)')
    expect(studentSupportMigrationSql).not.toContain('with check (true)')
  })
})
