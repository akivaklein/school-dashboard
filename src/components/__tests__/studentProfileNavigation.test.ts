import { describe, expect, it } from 'vitest'
import { getStudentById, getStudentNavigationPair, normalizeStudentProfileFields } from '../studentProfileNavigation'

describe('getStudentNavigationPair', () => {
  it('returns the previous and next students in the current display order', () => {
    const students = [
      { id: 1, name: 'Ari' },
      { id: 2, name: 'Ben' },
      { id: 3, name: 'Chaim' },
    ]

    expect(getStudentNavigationPair(students, 2)).toEqual({
      previous: { id: 1, name: 'Ari' },
      next: { id: 3, name: 'Chaim' },
    })
  })

  it('returns null values when the current student is at an edge of the list', () => {
    const students = [
      { id: 1, name: 'Ari' },
      { id: 2, name: 'Ben' },
    ]

    expect(getStudentNavigationPair(students, 1)).toEqual({
      previous: null,
      next: { id: 2, name: 'Ben' },
    })
  })

  it('matches students even when ids are stored as different primitives', () => {
    const students = [{ id: 1, name: 'Yair Bloom' }]

    expect(getStudentById(students, '1')).toEqual({ id: 1, name: 'Yair Bloom' })
  })

  it('normalizes missing attendance fields to safe empty arrays', () => {
    expect(normalizeStudentProfileFields({ id: '1', name: 'Yair Bloom' })).toEqual({
      att: [],
      breakfast: [],
      parentCalls: [],
      behaviorLog: [],
    })
  })
})
