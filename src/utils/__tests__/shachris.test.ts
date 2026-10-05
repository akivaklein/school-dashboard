import { describe, expect, it } from 'vitest'
import { calculateAge, completeShachrisExpectation, hasMetShachrisExpectation, INITIAL_SHACHRIS_CONFIG, nextShachrisSection, resolveShachrisExpectation, validateShachrisConfig, type ShachrisAssignment, type ShachrisRecord } from '../shachris'

const assignment: ShachrisAssignment = { id: 'override', student_id: 1, mode: 'manual', milestone_id: 'ashrei', section_ids: null, reason: '', actor_name: 'Rebbe', effective_date: '2026-10-05', created_at: '2026-10-05T12:00:00Z' }

describe('Shachris individual requirements', () => {
  it('calculates age on the birthday without UTC date conversion', () => {
    expect(calculateAge('2013-10-06', '2026-10-05')).toBe(12)
    expect(calculateAge('2013-10-06', '2026-10-06')).toBe(13)
    expect(calculateAge('2014-02-30')).toBeNull()
    expect(calculateAge('2027-01-01', '2026-10-05')).toBeNull()
    expect(calculateAge(null)).toBeNull()
  })
  it('gives manual milestones and custom section sets priority over age and grade defaults', () => {
    const config = { ...INITIAL_SHACHRIS_CONFIG, rules: [{ id: 'older', grade: '8', minAge: 12, maxAge: null, milestoneId: 'full' }] }
    expect(resolveShachrisExpectation(config, assignment, 13, '8').milestoneId).toBe('ashrei')
    expect(resolveShachrisExpectation(config, { ...assignment, section_ids: ['shema'] }, 13, '8').sectionIds).toEqual(['shema'])
    expect(resolveShachrisExpectation(config, { ...assignment, mode: 'default' }, 13, '8').milestoneId).toBe('full')
    expect(resolveShachrisExpectation(config, undefined, null, '8').milestoneId).toBe('start')
  })
  it('shows the next missing section and completion at the final milestone', () => {
    expect(nextShachrisSection(INITIAL_SHACHRIS_CONFIG, resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, assignment, 12, '7'))?.id).toBe('shema')
    expect(nextShachrisSection(INITIAL_SHACHRIS_CONFIG, resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id: 'full' }, 12, '7'))).toBeNull()
  })
  it('bulk completion respects each requirement and preserves presence, rating, extra sections and snapshots', () => {
    const records: ShachrisRecord[] = ['start', 'full'].map((milestone_id, index) => ({ session_id: 'today', student_id: index + 1, expectation: resolveShachrisExpectation(INITIAL_SHACHRIS_CONFIG, { ...assignment, milestone_id }, 13, '8'), presence: index ? 'absent' : 'present', said_section_ids: index ? [] : ['shema'], rating_id: 'ni', note: '', revision: 0, updated_by_name: '' }))
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
  })
})