import { describe, expect, it } from 'vitest'
import { calculateShachrisExtraSeconds, isShachrisLate, isShachrisReadyForCheck, needsShachrisAttention, personallyClearShachrisRecord, shachrisPresenceLabel } from '../shachris'
import { isShachrisRosterStudent, shachrisGraceMinutes } from '../shachris'
import { calculateAge, calculateShachrisMinutesLate, calculateShachrisMinutesOut, completePresentShachrisRequirements, completeShachrisExpectation, getShachrisGrade, hasMetShachrisExpectation, INITIAL_SHACHRIS_CONFIG, latestOpenShachrisLeave, nextShachrisSection, resolveShachrisExpectation, resolveShachrisStayRequirement, validateShachrisConfig, type ShachrisAssignment, type ShachrisConfig, type ShachrisRecord } from '../shachris'

const assignment: ShachrisAssignment = { id: 'override', student_id: 1, mode: 'manual', milestone_id: 'ashrei', section_ids: null, reason: '', actor_name: 'Rebbe', effective_date: '2026-10-05', duration: 'future', created_at: '2026-10-05T12:00:00Z' }

describe('Shachris individual requirements', () => {
  it('admits only active authoritative YK 7th/8th assignments', () => {
    expect(isShachrisRosterStudent({ is_active: true }, 'yk-b')).toBe(true)
    expect(isShachrisRosterStudent({ is_active: true }, 'yk-a')).toBe(true)
    expect(isShachrisRosterStudent({ is_active: false }, 'yk-a')).toBe(false)
    for (const assignmentId of ['mesivta-8', 'yk-6', 'yk-9', 'Gemara 8', '', null]) expect(isShachrisRosterStudent({ is_active: true }, assignmentId)).toBe(false)
  })
  it('uses an inclusive configurable grace without changing the factual after-grace minutes', () => {
    const start = '2026-10-06T07:00:00Z'
    expect(shachrisGraceMinutes(INITIAL_SHACHRIS_CONFIG)).toBe(2)
    for (const arrival of ['2026-10-06T07:00:10Z', '2026-10-06T07:01:59Z', '2026-10-06T07:02:00Z']) {
      expect(isShachrisLate(start, arrival, 2)).toBe(false)
      expect(calculateShachrisMinutesLate(start, arrival, 2)).toBe(0)
    }
    expect(isShachrisLate(start, '2026-10-06T07:02:01Z', 2)).toBe(true)
    expect(calculateShachrisMinutesLate(start, '2026-10-06T07:08:00Z', 2)).toBe(8)
    expect(isShachrisLate(start, '2026-10-06T07:01:00Z', 0)).toBe(true)
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, arrivalGraceMinutes: -1 })).toBeTruthy()
  })
  it('calculates age on the birthday without UTC date conversion', () => {
    expect(calculateAge('2013-10-06', '2026-10-05')).toBe(12)
    expect(calculateAge('2013-10-06', '2026-10-06')).toBe(13)
    expect(calculateAge('2014-02-30')).toBeNull()
    expect(calculateAge('2027-01-01', '2026-10-05')).toBeNull()
    expect(calculateAge(null)).toBeNull()
  })
  it('gives manual milestones and custom section sets priority over authoritative grade defaults', () => {
    const config: ShachrisConfig = { ...INITIAL_SHACHRIS_CONFIG, rules: [{ id: 'eighth', grade: '8', milestoneId: 'full' }] }
    expect(resolveShachrisExpectation(config, assignment, 'yk-a').milestoneId).toBe('ashrei')
    expect(resolveShachrisExpectation(config, { ...assignment, section_ids: ['shema'] }, 'yk-a').sectionIds).toEqual(['shema'])
    expect(resolveShachrisExpectation(config, { ...assignment, mode: 'default' }, 'yk-a').milestoneId).toBe('full')
    expect(resolveShachrisExpectation(config, undefined, 'yk-b').milestoneId).toBe('start')
  })
  it('uses only the primary class assignment and never instructional level/group labels', () => {
    const config: ShachrisConfig = { ...INITIAL_SHACHRIS_CONFIG, rules: [{ id: 'seventh', grade: '7', milestoneId: 'ashrei' }, { id: 'eighth', grade: '8', milestoneId: 'full' }] }
    expect(getShachrisGrade('yk-b')).toBe('7')
    expect(getShachrisGrade('yk-a')).toBe('8')
    expect(resolveShachrisExpectation(config, undefined, 'yk-b').milestoneId).toBe('ashrei')
    expect(resolveShachrisExpectation(config, undefined, 'yk-a').milestoneId).toBe('full')
    for (const group of ['Mishna 8', 'Gemara Level 8', 'Math 8', 'Reading 8', 'teacher-group', '8', null]) {
      expect(getShachrisGrade(group)).toBe('')
      expect(resolveShachrisExpectation(config, undefined, group).milestoneId).toBe('start')
    }
  })
  it('shows the next missing section and completion at the final milestone', () => {
    expect(nextShachrisSection(INITIAL_SHACHRIS_CONFIG, resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, assignment, 'yk-b'))?.id).toBe('shema')
    expect(nextShachrisSection(INITIAL_SHACHRIS_CONFIG, resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id: 'full' }, 'yk-b'))).toBeNull()
  })
  it('bulk completion respects each requirement and preserves presence, rating, extra sections and snapshots', () => {
    const records: ShachrisRecord[] = ['start', 'full'].map((milestone_id, index) => ({ session_id: 'today', student_id: index + 1, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id }, 'yk-a'), stay_requirement: resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, undefined, 11 + index), presence: index ? 'absent' : 'present', arrival_at: null, last_return_at: null, leave_intervals: [], requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null, said_section_ids: index ? [] : ['shema'], rating_id: 'ni', note: '', revision: 0, updated_by_name: '' }))
    const completed = records.map(completeShachrisExpectation)
    expect(completed[0].said_section_ids).toEqual(['shema', 'baruch-sheamar'])
    expect(completed[1].said_section_ids).toHaveLength(4)
    expect(completed.map(record => record.presence)).toEqual(['present', 'absent'])
    expect(completed.every(record => record.rating_id === 'ni' && hasMetShachrisExpectation(record))).toBe(true)
    expect(records[1].said_section_ids).toEqual([])
    expect(completeShachrisExpectation(completed[0])).toEqual(completed[0])
  })
  it('validates default rules and section references', () => {
    expect(validateShachrisConfig(INITIAL_SHACHRIS_CONFIG)).toBeNull()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, fallbackMilestoneId: 'missing' })).toBeTruthy()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, milestones: [{ id: 'bad', label: 'Bad', sectionIds: ['missing'] }] })).toBeTruthy()
    const rule = { id: 'eighth', grade: '8' as const, milestoneId: 'full' }
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [{ ...rule, minAge: 12 }] as unknown as ShachrisConfig['rules'] } )).toBeTruthy()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [{ ...rule, groupId: 'gemara-8' }] as unknown as ShachrisConfig['rules'] } )).toBeTruthy()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [rule, { ...rule, id: 'duplicate' }] })).toBeTruthy()
  })
  it('bulk completes only present students, leaving absent, left, and unmarked students untouched', () => {
    const records: ShachrisRecord[] = (['present', 'present', 'absent', 'left', 'unmarked'] as const).map((presence, index) => ({ session_id: 'today', student_id: index + 1, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id: index ? 'full' : 'start' }, 'yk-a'), stay_requirement: resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, undefined, 11), presence, arrival_at: null, last_return_at: null, leave_intervals: [], requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null, said_section_ids: [], rating_id: 'ni', note: '', revision: 0, updated_by_name: '' }))
    const changed = completePresentShachrisRequirements(records)
    expect(changed.map(record => record.student_id)).toEqual([1, 2])
    expect(changed.map(record => record.said_section_ids.length)).toEqual([1, 4])
    expect(changed.every(record => record.presence === 'present' && record.rating_id === 'ni')).toBe(true)
    expect(records.every(record => record.said_section_ids.length === 0)).toBe(true)
    expect(completePresentShachrisRequirements(changed)).toEqual([])
  })
  it('resolves the real age 11/12/13 stay-until defaults and gives manual duration overrides priority', () => {
    expect([11, 12, 13].map(age => resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, undefined, age).requiredUntil)).toEqual(['shemoneh-esrei', 'chazaras-hashatz', 'end-davening'])
    expect(resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, { id: 'today', student_id: 4, mode: 'manual', required_until: 'end-davening', reason: '', actor_name: 'Rebbe', effective_date: '2026-10-05', duration: 'today', created_at: '' }, 11)).toMatchObject({ requiredUntil: 'end-davening', source: 'manual', duration: 'today' })
    expect(resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, undefined, null).source).toBe('unassigned')
  })
  it('calculates automatic lateness and multiple leave/return intervals, including an open leave', () => {
    expect(calculateShachrisMinutesLate('2026-10-05T07:00:00Z', '2026-10-05T07:08:59Z')).toBe(8)
    const intervals = [{ leftAt: '2026-10-05T07:10:00Z', returnedAt: '2026-10-05T07:15:00Z', permission: 'with' as const }, { leftAt: '2026-10-05T07:20:00Z', returnedAt: null, permission: 'without' as const }]
    expect(calculateShachrisMinutesOut(intervals, Date.parse('2026-10-05T07:27:00Z'))).toBe(12)
    expect(latestOpenShachrisLeave(intervals)).toEqual(intervals[1])
  })
  it('requires personal clearance, including arrivals after the communal milestone', () => {
    const record: ShachrisRecord = { session_id: 'today', student_id: 5, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, undefined, 'yk-b'), stay_requirement: resolveShachrisStayRequirement(INITIAL_SHACHRIS_CONFIG, undefined, 11), presence: 'present', arrival_at: '2026-10-06T07:35:00Z', last_return_at: null, leave_intervals: [], requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null, said_section_ids: [], rating_id: '', note: '', revision: 0, updated_by_name: '' }
    const times = { 'shemoneh-esrei': '2026-10-06T07:30:00Z' }
    expect(isShachrisReadyForCheck(record, times)).toBe(true)
    expect(record.requirement_result).toBe('pending')
    expect(() => personallyClearShachrisRecord(record, {}, '2026-10-06T07:40:00Z', 'Rebbe')).toThrow()
    expect(() => personallyClearShachrisRecord({ ...record, presence: 'left' }, times, '2026-10-06T07:40:00Z', 'Rebbe')).toThrow()
    const cleared = personallyClearShachrisRecord(record, times, '2026-10-06T07:40:00Z', 'Rebbe')
    expect(cleared.personally_cleared_by_name).toBe('Rebbe')
    expect(cleared.requirement_result).toBe('met')
    expect(isShachrisReadyForCheck(cleared, times)).toBe(false)
    expect(isShachrisReadyForCheck({ ...record, requirement_result: 'met' }, times)).toBe(true)
    expect(calculateShachrisExtraSeconds(cleared, Date.parse('2026-10-06T07:43:00Z'))).toBe(180)
    expect(calculateShachrisExtraSeconds({ ...cleared, extra_stay_intervals: [{ startedAt: '2026-10-06T07:40:00Z', endedAt: '2026-10-06T07:41:00Z' }, { startedAt: '2026-10-06T07:44:00Z', endedAt: null }] }, Date.parse('2026-10-06T07:45:00Z'))).toBe(120)
    expect(needsShachrisAttention({ ...cleared, presence: 'left', late_excused: true }, '2026-10-06T07:00:00Z')).toBe(false)
  })
  it('keeps late facts separate from excusal and explicit nonattendance', () => {
    const record = { presence: 'present', arrival_at: '2026-10-06T07:08:00Z', stay_requirement: { requiredUntil: 'shemoneh-esrei' } } as ShachrisRecord
    expect(isShachrisLate('2026-10-06T07:00:00Z', '2026-10-06T07:00:10Z')).toBe(true)
    expect(needsShachrisAttention(record, '2026-10-06T07:00:00Z')).toBe(true)
    expect(needsShachrisAttention({ ...record, late_excused: true }, '2026-10-06T07:00:00Z')).toBe(false)
    expect(calculateShachrisMinutesLate('2026-10-06T07:00:00Z', record.arrival_at)).toBe(8)
    expect(shachrisPresenceLabel({ ...record, presence: 'unmarked' })).toBe('Not Marked')
    expect(shachrisPresenceLabel({ ...record, presence: 'absent', absence_status: 'excused' })).toBe('Excused from Shul')
    expect(shachrisPresenceLabel({ ...record, presence: 'absent', absence_status: 'not_in_shul' })).toBe('Not in Shul')
    expect(needsShachrisAttention({ ...record, presence: 'absent', absence_status: 'excused' }, '2026-10-06T07:00:00Z')).toBe(false)
  })
})