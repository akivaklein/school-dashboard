import { describe, expect, it } from 'vitest'
import {
  buildLatestSessionRows,
  buildOverallProgressRows,
  buildStudentSubjectHistory,
  getIncompleteBulkStudents,
} from '../academicsReviewUtils'
import { archiveRecord, isArchivedRecord, isDeletedRecord, permanentlyDeleteRecord, restoreArchivedRecord } from '../../utils/archiveRecord'

const ratingScore = { Weak: 1, Developing: 2, Good: 3, Great: 4 }

const students = [
  {
    id: 1,
    name: 'Avi',
    grade: '8',
    is_active: true,
    testScores: [
      { id: 'm1', subject: 'Math', skill: 'Addition', assessmentName: 'Quiz 1', assessmentType: 'Quiz', date: '2026-02-01', enteredAt: '2026-02-01T09:00:00Z', scoreType: 'points', score: 18, maxScore: 20, attemptStatus: 'scored' },
      { id: 'm2', subject: 'Math', skill: 'Subtraction', assessmentName: 'Quiz 2', assessmentType: 'Quiz', date: '2026-02-08', enteredAt: '2026-02-08T09:00:00Z', scoreType: 'points', score: 10, maxScore: 20, attemptStatus: 'scored' },
    ],
  },
  {
    id: 2,
    name: 'Beni',
    grade: '8',
    is_active: true,
    testScores: [
      { id: 'm3', subject: 'Math', skill: 'Addition', assessmentName: 'Quiz 1', assessmentType: 'Quiz', date: '2026-02-01', enteredAt: '2026-02-01T09:01:00Z', scoreType: 'status', score: null, maxScore: null, attemptStatus: 'absent' },
      { id: 'm4', subject: 'Math', skill: 'Subtraction', assessmentName: 'Quiz 2', assessmentType: 'Quiz', date: '2026-02-08', enteredAt: '2026-02-08T09:01:00Z', scoreType: 'status', score: null, maxScore: null, attemptStatus: 'missed' },
    ],
  },
  {
    id: 3,
    name: 'Chaim',
    grade: '7',
    is_active: true,
    testScores: [
      { id: 'm5', subject: 'Reading', skill: 'Fluency', assessmentName: 'Reading Check', assessmentType: 'Observation', date: '2026-02-09', enteredAt: '2026-02-09T09:00:00Z', scoreType: 'rating', rating: 'Good', attemptStatus: 'scored' },
    ],
  },
  {
    id: 4,
    name: 'Inactive',
    grade: '8',
    is_active: false,
    testScores: [],
  },
]

describe('academics review utilities', () => {
  it('blocks incomplete bulk grading while ignoring inactive students', () => {
    const incomplete = getIncompleteBulkStudents(students, { 1: { mode: 'score', score: 95 }, 2: { mode: 'score', score: '' } }, 'percentage')

    expect(incomplete.map(student => student.id)).toEqual([2, 3])
  })

  it('treats Absent and Missing as completed bulk results', () => {
    const incomplete = getIncompleteBulkStudents(students.slice(0, 2), { 1: { mode: 'absent', score: '' }, 2: { mode: 'missed', score: '' } }, 'points')

    expect(incomplete).toEqual([])
  })

  it('returns each student once for the latest session and supports class filtering', () => {
    const latest = buildLatestSessionRows({ students, scores: students.flatMap(student => (student.testScores || []).map(score => ({ ...score, studentId: student.id, studentName: student.name }))), classFilter: 'yk-a', subjectFilter: 'Math' })

    expect(latest.rows.map(row => row.student.id)).toEqual([1, 2])
    expect(latest.rows.map(row => row.status)).toEqual(['scored', 'missing'])
  })

  it('aggregates overall progress without counting Absent or Missing as zero', () => {
    const rows = buildOverallProgressRows({ students: students.slice(0, 2), subject: 'Math', ratingScore })
    const avi = rows.find(row => row.student.id === 1)
    const beni = rows.find(row => row.student.id === 2)

    expect(avi?.average).toBe(70)
    expect(avi?.assessmentCount).toBe(2)
    expect(avi?.strongAreas).toEqual(['Addition'])
    expect(avi?.weakerAreas).toEqual(['Subtraction'])
    expect(beni?.average).toBeNull()
    expect(beni?.assessmentCount).toBe(0)
  })

  it('builds newest-first student history for selected subject', () => {
    const history = buildStudentSubjectHistory(students[0], 'Math')

    expect(history.map(score => score.id)).toEqual(['m2', 'm1'])
  })

  it('archives, restores, and permanently deletes records without immediate erasure', () => {
    const archived = archiveRecord({ id: 'm1', subject: 'Math' }, 'Admin', '2026-02-10T00:00:00Z')
    const restored = restoreArchivedRecord(archived)
    const deleted = permanentlyDeleteRecord(archived, '2026-02-11T00:00:00Z')

    expect(isArchivedRecord(archived)).toBe(true)
    expect((restored as Record<string, unknown>).archivedAt).toBeUndefined()
    expect(isDeletedRecord(deleted)).toBe(true)
  })
})
