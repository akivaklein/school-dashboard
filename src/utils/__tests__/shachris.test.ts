import { describe, expect, it } from 'vitest'
import { calculateAge, completePresentShachrisRequirements, completeShachrisExpectation, getShachrisGrade, hasMetShachrisExpectation, INITIAL_SHACHRIS_CONFIG, nextShachrisSection, resolveShachrisExpectation, validateShachrisConfig, type ShachrisAssignment, type ShachrisConfig, type ShachrisRecord } from '../shachris'

const assignment: ShachrisAssignment = { id: 'override', student_id: 1, mode: 'manual', milestone_id: 'ashrei', section_ids: null, reason: '', actor_name: 'Rebbe', effective_date: '2026-10-05', duration: 'future', created_at: '2026-10-05T12:00:00Z' }

describe('Shachris individual requirements', () => {
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
    const records: ShachrisRecord[] = ['start', 'full'].map((milestone_id, index) => ({ session_id: 'today', student_id: index + 1, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id }, 'yk-a'), presence: index ? 'absent' : 'present', said_section_ids: index ? [] : ['shema'], rating_id: 'ni', note: '', revision: 0, updated_by_name: '' }))
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
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [{ ...rule, minAge: 12 }] } as ShachrisConfig)).toBeTruthy()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [{ ...rule, groupId: 'gemara-8' }] } as ShachrisConfig)).toBeTruthy()
    expect(validateShachrisConfig({ ...INITIAL_SHACHRIS_CONFIG, rules: [rule, { ...rule, id: 'duplicate' }] })).toBeTruthy()
  })
  it('bulk completes only present students, leaving absent, left, and unmarked students untouched', () => {
    const records: ShachrisRecord[] = (['present', 'present', 'absent', 'left', 'unmarked'] as const).map((presence, index) => ({ session_id: 'today', student_id: index + 1, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id: index ? 'full' : 'start' }, 'yk-a'), presence, said_section_ids: [], rating_id: 'ni', note: '', revision: 0, updated_by_name: '' }))
    const changed = completePresentShachrisRequirements(records)
    expect(changed.map(record => record.student_id)).toEqual([1, 2])
    expect(changed.map(record => record.said_section_ids.length)).toEqual([1, 4])
    expect(changed.every(record => record.presence === 'present' && record.rating_id === 'ni')).toBe(true)
    expect(records.every(record => record.said_section_ids.length === 0)).toBe(true)
    expect(completePresentShachrisRequirements(changed)).toEqual([])
  })
})