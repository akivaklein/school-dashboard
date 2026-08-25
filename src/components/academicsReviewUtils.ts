import { resolveStudentClassId } from './dashboardData'
import { isArchivedRecord, isDeletedRecord } from '../utils/archiveRecord'

export type GradeStudent = {
  id: number | string
  name?: string
  is_active?: boolean
  testScores?: GradeScore[]
  [key: string]: unknown
}

export type GradeScore = {
  id?: number | string
  studentId?: number | string
  studentName?: string
  teacher?: string
  subject?: string
  skill?: string
  assessmentName?: string
  assessmentType?: string
  gradingMethod?: string
  date?: string
  scoreType?: string
  score?: number | string | null
  maxScore?: number | string | null
  rating?: string | null
  notes?: string
  attemptStatus?: string
  enteredBy?: string
  enteredAt?: string
  sourceContext?: string
  [key: string]: unknown
}

export type BulkStudentState = {
  mode?: string
  score?: number | string | null
}

export type GradeSession = {
  key: string
  label: string
  date: string
  subject: string
  skill: string
  assessmentName: string
  assessmentType: string
  latestEnteredAt: string
  scores: GradeScore[]
}

export type LatestSessionRow = {
  student: GradeStudent
  score: GradeScore | null
  status: 'scored' | 'absent' | 'missing' | 'blank'
}

export type OverallProgressRow = {
  student: GradeStudent
  average: number | null
  currentLevel: string
  strongAreas: string[]
  weakerAreas: string[]
  assessmentCount: number
  validScores: GradeScore[]
}

export function isActiveGradeStudent(student: GradeStudent) {
  return student?.is_active !== false
}

export function isCompletedBulkResult(state: BulkStudentState | undefined, gradingMethod: string) {
  const mode = state?.mode || 'score'
  if (mode === 'absent' || mode === 'missed') return true

  const score = state?.score
  if (score === '' || score === null || score === undefined) return false

  if (gradingMethod === 'points' || gradingMethod === 'percentage') {
    return Number.isFinite(Number(score))
  }

  return String(score).trim().length > 0
}

export function getIncompleteBulkStudents(
  students: GradeStudent[],
  states: Record<string | number, BulkStudentState>,
  gradingMethod: string,
) {
  return students.filter(student => (
    isActiveGradeStudent(student) && !isCompletedBulkResult(states[student.id], gradingMethod)
  ))
}

export function flattenStudentScores(students: GradeStudent[]) {
  return students.flatMap(student => (
    (student.testScores || [])
      .filter(score => !isArchivedRecord(score) && !isDeletedRecord(score))
      .map(score => ({
        ...score,
        studentId: student.id,
        studentName: student.name,
      }))
  ))
}

export function buildGradeSessionKey(score: GradeScore) {
  return [
    score.date || '',
    score.subject || '',
    score.skill || '',
    score.assessmentName || '',
    score.assessmentType || '',
    score.teacher || '',
  ].join('||')
}

export function getGradeSessionLabel(score: GradeScore) {
  return [score.date, score.subject, score.skill, score.assessmentName || score.assessmentType]
    .filter(Boolean)
    .join(' - ')
}

export function getGradeSessions(scores: GradeScore[]) {
  const byKey = new Map<string, GradeSession>()

  scores.forEach(score => {
    if (!score.date || !score.subject) return
    const key = buildGradeSessionKey(score)
    const current = byKey.get(key)
    const enteredAt = String(score.enteredAt || score.date || '')

    if (!current) {
      byKey.set(key, {
        key,
        label: getGradeSessionLabel(score),
        date: String(score.date || ''),
        subject: String(score.subject || ''),
        skill: String(score.skill || ''),
        assessmentName: String(score.assessmentName || ''),
        assessmentType: String(score.assessmentType || ''),
        latestEnteredAt: enteredAt,
        scores: [score],
      })
      return
    }

    current.scores.push(score)
    if (enteredAt.localeCompare(current.latestEnteredAt) > 0) {
      current.latestEnteredAt = enteredAt
    }
  })

  return Array.from(byKey.values()).sort((left, right) => (
    right.latestEnteredAt.localeCompare(left.latestEnteredAt) || right.date.localeCompare(left.date)
  ))
}

export function getScoreReviewStatus(score: GradeScore | null): LatestSessionRow['status'] {
  if (!score) return 'blank'
  if (score.attemptStatus === 'absent') return 'absent'
  if (score.attemptStatus === 'missed' || score.scoreType === 'status') return 'missing'
  return 'scored'
}

export function buildLatestSessionRows({
  students,
  scores,
  classFilter = 'all',
  subjectFilter = 'all',
  skillFilter = 'all',
  sessionKey = 'latest',
}: {
  students: GradeStudent[]
  scores: GradeScore[]
  classFilter?: string
  subjectFilter?: string
  skillFilter?: string
  sessionKey?: string
}) {
  const filteredScores = scores.filter(score => (
    (subjectFilter === 'all' || score.subject === subjectFilter) &&
    (skillFilter === 'all' || score.skill === skillFilter)
  ))
  const sessions = getGradeSessions(filteredScores)
  const session = sessionKey === 'latest'
    ? sessions[0] || null
    : sessions.find(item => item.key === sessionKey) || null

  if (!session) return { session: null, rows: [] as LatestSessionRow[], sessions }

  const scoresByStudentId = new Map<string, GradeScore>()
  session.scores.forEach(score => {
    if (score.studentId === null || score.studentId === undefined) return
    scoresByStudentId.set(String(score.studentId), score)
  })

  const expectedStudents = classFilter === 'all'
    ? students.filter(student => isActiveGradeStudent(student) && scoresByStudentId.has(String(student.id)))
    : students.filter(student => isActiveGradeStudent(student) && resolveStudentClassId(student) === classFilter)

  return {
    session,
    sessions,
    rows: expectedStudents
      .slice()
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
      .map(student => {
        const score = scoresByStudentId.get(String(student.id)) || null
        return { student, score, status: getScoreReviewStatus(score) }
      }),
  }
}

export function isValidProgressScore(score: GradeScore) {
  if (score.attemptStatus === 'absent' || score.attemptStatus === 'missed' || score.scoreType === 'status') return false
  if (score.scoreType === 'points') return Number(score.maxScore || 0) > 0 && Number.isFinite(Number(score.score))
  if (score.scoreType === 'rating') return !!score.rating
  return false
}

export function getNormalizedScoreValue(score: GradeScore, ratingScore: Record<string, number>) {
  if (score.scoreType === 'points') {
    const maxScore = Number(score.maxScore || 0)
    if (maxScore <= 0) return null
    return Math.round((Number(score.score || 0) / maxScore) * 100)
  }

  if (score.scoreType === 'rating') {
    const ratingValue = ratingScore[String(score.rating || '')]
    if (!Number.isFinite(ratingValue)) return null
    return Math.round((ratingValue / 4) * 100)
  }

  return null
}

function describeLevel(average: number | null) {
  if (average === null) return 'No valid marks yet'
  if (average >= 90) return 'Strong'
  if (average >= 75) return 'On track'
  if (average >= 60) return 'Developing'
  return 'Needs support'
}

export function buildOverallProgressRows({
  students,
  subject,
  skillFilter = 'all',
  ratingScore,
}: {
  students: GradeStudent[]
  subject: string
  skillFilter?: string
  ratingScore: Record<string, number>
}) {
  return students
    .filter(isActiveGradeStudent)
    .slice()
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    .map(student => {
      const subjectScores = (student.testScores || [])
        .filter(score => !isArchivedRecord(score) && !isDeletedRecord(score) && score.subject === subject && (skillFilter === 'all' || score.skill === skillFilter))
      const validScores = subjectScores.filter(isValidProgressScore)
      const normalized = validScores
        .map(score => getNormalizedScoreValue(score, ratingScore))
        .filter((value): value is number => value !== null)
      const average = normalized.length
        ? Math.round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length)
        : null
      const bySkill = new Map<string, number[]>()
      validScores.forEach(score => {
        const value = getNormalizedScoreValue(score, ratingScore)
        if (value === null) return
        const key = String(score.skill || 'General')
        bySkill.set(key, [...(bySkill.get(key) || []), value])
      })
      const skillRows = Array.from(bySkill.entries()).map(([skill, values]) => ({
        skill,
        average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      }))

      return {
        student,
        average,
        currentLevel: describeLevel(average),
        strongAreas: skillRows.filter(row => row.average >= 85).map(row => row.skill).slice(0, 3),
        weakerAreas: skillRows.filter(row => row.average < 70).map(row => row.skill).slice(0, 3),
        assessmentCount: validScores.length,
        validScores,
      }
    })
}

export function buildStudentSubjectHistory(student: GradeStudent, subject: string, skillFilter = 'all') {
  return (student.testScores || [])
    .filter(score => !isArchivedRecord(score) && !isDeletedRecord(score) && score.subject === subject && (skillFilter === 'all' || score.skill === skillFilter))
    .slice()
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')) || String(right.enteredAt || '').localeCompare(String(left.enteredAt || '')))
}