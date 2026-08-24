import { describe, expect, it } from 'vitest'
import { buildStudentNavigationList, getStudentById, getStudentNavigationPair, normalizeStudentProfileFields } from '../studentProfileNavigation'

describe('buildStudentNavigationList', () => {
  const roster = [
    { id: 101, name: 'Current 8th', grade: '8', is_active: true },
    { id: 102, name: 'Current 7th', grade: '7', is_active: true },
    { id: 103, name: 'Archived 8th', grade: '8', is_active: false },
    { id: 104, name: 'Yair Bloom', grade: '', is_active: true },
    { id: 105, name: 'Mesivta Student', grade: '10', is_active: true },
  ]

  it('keeps only active grade 7/8 students in the visible order', () => {
    expect(buildStudentNavigationList(roster).map(student => student.id)).toEqual([101, 102])
  })

  it('never lets archived or out-of-scope students be reached through the arrows', () => {
    const navigable = buildStudentNavigationList(roster)

    const fromEighth = getStudentNavigationPair(navigable, 101)
    expect(fromEighth.previous).toBeNull()
    expect(fromEighth.next).toMatchObject({ id: 102 })

    const fromSeventh = getStudentNavigationPair(navigable, 102)
    expect(fromSeventh.previous).toMatchObject({ id: 101 })
    expect(fromSeventh.next).toBeNull()

    const reachableIds = new Set(
      navigable.flatMap(student => {
        const pair = getStudentNavigationPair(navigable, student.id)
        return [pair.previous?.id, pair.next?.id].filter(id => id != null)
      }),
    )
    expect(reachableIds.has(103)).toBe(false)
    expect(reachableIds.has(104)).toBe(false)
    expect(reachableIds.has(105)).toBe(false)
  })

  it('disables both arrows when only one eligible student remains', () => {
    const singleGradeList = buildStudentNavigationList(roster.filter(student => student.grade === '7'))

    expect(singleGradeList).toHaveLength(1)
    expect(getStudentNavigationPair(singleGradeList, 102)).toEqual({ previous: null, next: null })
  })

  it('gives no navigation targets when the open student is not in the visible list', () => {
    expect(getStudentNavigationPair(buildStudentNavigationList(roster), 103)).toEqual({ previous: null, next: null })
  })
})

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
