import { isYeshivaKetanaStudent } from './dashboardData'

type NavigableStudent = { id?: string | number; is_active?: boolean }

// Arrows may only walk the active, in-scope (grade 7/8) students of the list the profile was opened from.
export function buildStudentNavigationList<T extends NavigableStudent>(students: T[] | null | undefined): Array<T & { id: string | number }> {
  if (!Array.isArray(students)) return []

  const seen = new Set<string>()
  return students.filter((student): student is T & { id: string | number } => {
    if (!student || student.id == null) return false
    if (student.is_active === false) return false
    if (!isYeshivaKetanaStudent(student)) return false

    const key = String(student.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getStudentNavigationPair<T extends { id: string | number }>(students: T[], currentStudentId: string | number | null | undefined) {
  if (!Array.isArray(students) || students.length === 0 || currentStudentId == null) {
    return { previous: null, next: null }
  }

  const index = students.findIndex(student => Number(student.id) === Number(currentStudentId))
  if (index === -1) return { previous: null, next: null }

  return {
    previous: index > 0 ? students[index - 1] : null,
    next: index < students.length - 1 ? students[index + 1] : null,
  }
}

export function getStudentById<T extends { id?: string | number }>(students: T[], currentStudentId: string | number | null | undefined) {
  if (!Array.isArray(students) || students.length === 0 || currentStudentId == null) {
    return undefined
  }

  return students.find(student => Number(student.id) === Number(currentStudentId))
}

export function normalizeStudentProfileFields<T extends Record<string, unknown>>(student: T | null | undefined) {
  if (!student) return {
    att: [],
    breakfast: [],
    parentCalls: [],
    behaviorLog: [],
  }

  return {
    att: Array.isArray(student.att) ? student.att : [],
    breakfast: Array.isArray(student.breakfast) ? student.breakfast : [],
    parentCalls: Array.isArray(student.parentCalls) ? student.parentCalls : [],
    behaviorLog: Array.isArray(student.behaviorLog) ? student.behaviorLog : [],
  }
}
