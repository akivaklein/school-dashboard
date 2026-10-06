import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { INITIAL_SHACHRIS_CONFIG } from '../../utils/shachris'

const migration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261005_shachris_checkpoint.sql'), 'utf8')
const liveSessionMigration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261005213145_shachris_live_attendance.sql'), 'utf8')
const clearanceMigration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261006042222_shachris_personal_clearance.sql'), 'utf8')
const startCorrectionMigration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261006050418_shachris_roster_grace_start_correction.sql'), 'utf8')
const settingsTargetMigration = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261006065220_shachris_settings_targeted_update.sql'), 'utf8')
const dobImport = readFileSync(path.resolve(__dirname, '../../../docs/20261005_shachris_dob_import.sql'), 'utf8')

describe('Shachris additive foundation', () => {
  it('targets the singleton settings row without bypassing UPDATE safety', () => {
    expect(settingsTargetMigration).toContain('from public.shachris_settings where id = true for update')
    expect(settingsTargetMigration).toContain('where id = settings_row.id returning * into settings_row')
    expect(settingsTargetMigration).toContain('Settings changed elsewhere. Reload before saving.')
    expect(settingsTargetMigration).toContain("dashboard_has_permission('setup', 'edit')")
    expect(settingsTargetMigration).not.toMatch(/disable|safeupdate|session_replication_role|grant /i)
  })
  it('uses ordinary editing permission for audited start corrections and restricts the roster', () => {
    expect(startCorrectionMigration).not.toContain('dashboard_is_admin')
    expect(startCorrectionMigration).toContain("dashboard_has_permission('attendance', 'edit')")
    expect(startCorrectionMigration).toContain("assignment.class_id in ('yk-a', 'yk-b')")
    expect(startCorrectionMigration).toContain('student.is_active is not false')
    expect(startCorrectionMigration).toContain('public.shachris_start_has_activity(p_session_id)')
    expect(startCorrectionMigration).toContain("p_confirmed is distinct from true")
    expect(startCorrectionMigration).toContain('previousArrivals')
    expect(startCorrectionMigration).toContain('"arrivalGraceMinutes":2')
    expect(startCorrectionMigration).toContain('enable row level security')
    expect(startCorrectionMigration).not.toMatch(/(?:delete from|truncate|drop table) public\./i)
  })
  it('stores daily facts and requires personal clearance without rewriting historical results', () => {
    for (const field of ['late_minutes', 'late_reason', 'late_excused', 'absence_status', 'personally_cleared_at', 'personally_cleared_by_name', 'personally_cleared_milestone', 'extra_stay_intervals', 'stayed_beyond_required']) expect(clearanceMigration).toContain(`add column ${field}`)
    const marker = clearanceMigration.slice(clearanceMigration.indexOf('create or replace function public.shachris_mark_milestone'), clearanceMigration.indexOf('create function public.shachris_update_daily_fact'))
    expect(marker).not.toContain('update public.shachris_student_records')
    expect(clearanceMigration).toContain("'personal-clearance'")
    expect(clearanceMigration).toContain('auth.uid() is null')
    expect(clearanceMigration).toContain('from public, anon, authenticated')
    expect(clearanceMigration).toContain('Use attendance actions to change presence')
    expect(clearanceMigration).not.toMatch(/(?:drop table|truncate|delete from) public\./i)
  })
  it('adds DOB without updating existing students or legacy Davening records', () => {
    expect(migration).toContain('add column if not exists date_of_birth date')
    expect(migration).not.toMatch(/(?:update|delete from|drop table|truncate) public\.(?:students|davening_|staff)/i)
  })
  it('keeps SQL and client initial configuration identical', () => {
    const seed = migration.match(/values \('([\s\S]*?)'::jsonb\)/)?.[1]
    const { stayMilestones, stayRules, ...initialProgressConfig } = INITIAL_SHACHRIS_CONFIG
    expect(JSON.parse(seed || '{}')).toEqual(initialProgressConfig)
    expect(liveSessionMigration).toContain("'stayMilestones'")
    expect(liveSessionMigration).toContain("'stayRules'")
    expect(stayRules.map(rule => rule.age)).toEqual([11, 12, 13])
    expect(stayMilestones.map(milestone => milestone.id)).toEqual(['hodu', 'shemoneh-esrei', 'chazaras-hashatz', 'end-davening'])
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
    expect(dobImport.match(/\(\d+, array\[/g)).toHaveLength(16)
    expect(dobImport).toContain("(123, array['David Goldberger', 'Goldberger David'], '2013-04-30')")
    expect(dobImport).toContain("(124, array['Benyamin Goldberger', 'Goldberger Benyamin'], '2013-04-30')")
    expect(dobImport).toContain('where id <> reviewed_student_id')
    expect(dobImport).toContain('(select count(*) from shachris_dob_input) <> 16')
    expect(dobImport).toContain('(select count(distinct id) from shachris_dob_matches) <> 16')
    expect(dobImport).toContain('having count(matched.id) <> 1')
    expect(dobImport).toContain('student.date_of_birth is not null and student.date_of_birth <> matched.dob')
    expect(dobImport).toContain('student.date_of_birth is null')
    expect(dobImport.indexOf('exactly 16 reviewed DOBs')).toBeLessThan(dobImport.indexOf('create temporary table shachris_dob_matches'))
  })
  it('resolves defaults only from primary class assignments and rejects other rule dimensions', () => {
    const resolver = migration.slice(migration.indexOf('create or replace function public.shachris_resolve_expectation'), migration.indexOf('revoke all on function public.shachris_resolve_expectation'))
    expect(resolver).toContain('public.student_class_assignments')
    expect(resolver).not.toMatch(/date_of_birth|student_age|minAge|maxAge|instructional_group|student\.grade/)
    expect(migration).toContain("(rule - 'id' - 'grade' - 'milestoneId') <> '{}'::jsonb")
  })
  it('adds live attendance and communal-result state without replacing checklist data', () => {
    expect(liveSessionMigration).toContain('add column if not exists started_at timestamptz')
    expect(liveSessionMigration).toContain("add column if not exists leave_intervals jsonb not null default '[]'::jsonb")
    expect(liveSessionMigration).toContain("add column if not exists requirement_result text not null default 'pending'")
    expect(liveSessionMigration).toContain("requirement_result = case when presence = 'present' then 'met' else 'not_met' end")
    expect(liveSessionMigration).toContain("and requirement_result = 'pending'")
    expect(liveSessionMigration).toContain('public.shachris_stay_expectations')
    expect(liveSessionMigration).toContain('public.dashboard_has_permission')
    expect(liveSessionMigration).not.toMatch(/(?:drop|truncate) (?:table )?public\.(?:shachris_student_records|shachris_expectations|davening_)/i)
  })
  it('records Hodu, one-click arrival, permission-tagged intervals and communal requirement decisions', () => {
    expect(liveSessionMigration).toContain("milestone_times = jsonb_set(milestone_times, '{hodu}'")
    expect(liveSessionMigration).toContain("jsonb_build_object('at', session_row.started_at, 'bulkAtStart', true)")
    expect(liveSessionMigration).toContain("jsonb_build_object('leftAt', happened_at, 'returnedAt', null, 'permission', p_permission)")
    expect(liveSessionMigration).toContain("p_event_type not in ('arrival', 'left', 'returned')")
    expect(liveSessionMigration).toContain("duration = 'future' or effective_date = p_date")
  })
})