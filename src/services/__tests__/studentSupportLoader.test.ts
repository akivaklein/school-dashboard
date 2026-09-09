import { describe, expect, it, vi } from 'vitest'
import { describeSupportSourceError, loadStudentSupportSources } from '../studentSupportLoader'

describe('Student Support source loading', () => {
  it('keeps successful observations when goals fail', async () => {
    const observations = [{ id: 12, note: 'Persisted observation' }]
    const result = await loadStudentSupportSources({
      loadGoals: vi.fn().mockRejectedValue({ code: '42501', message: 'permission denied for table student_goals' }),
      loadObservations: vi.fn().mockResolvedValue(observations),
    })

    expect(result.observations).toEqual({ data: observations, error: null })
    expect(result.goals.data).toBeNull()
    expect(result.goals.error).toContain('student_goals')
    expect(result.goals.error).toContain('42501')
  })

  it('keeps successful goals when observations fail', async () => {
    const goals = [{ id: 'goal-1', title: 'Ask for help' }]
    const result = await loadStudentSupportSources({
      loadGoals: vi.fn().mockResolvedValue(goals),
      loadObservations: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    })

    expect(result.goals).toEqual({ data: goals, error: null })
    expect(result.observations.data).toBeNull()
    expect(result.observations.error).toBe('Observations could not load from student_notes: network request failed. Check the connection and try again.')
  })

  it('formats PostgREST errors with their source and code', () => {
    expect(describeSupportSourceError('Flags', 'student_flags', { code: '42501', message: 'permission denied' }))
      .toBe('Flags could not load from student_flags (42501): permission denied')
  })
})