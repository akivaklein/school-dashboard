import { getTeacherAssignedStudentIds, studentBelongsToClass } from './dashboardData'

type PrintableStudent = { id: string | number; name?: string; is_active?: boolean }
type PrintableClass = { id: string | number; name: string; teacher?: string }

function normalizeName(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function getPrintableTeacherNames(classes: PrintableClass[], setupAssignments: Record<string, unknown>, teacherAssignedStudentIdsByName: Map<string, Set<number>>) {
  return Array.from(new Set([
    ...classes.map(entry => String(entry.teacher || '').trim()),
    ...Object.keys(setupAssignments || {}),
    ...Array.from(teacherAssignedStudentIdsByName.keys()),
  ].filter(Boolean))).sort()
}

export function getPrintableRoster({
  students,
  classes,
  scope,
  classId,
  teacherName,
  setupAssignments,
  additionalClassIdsByStudent,
  teacherAssignedStudentIdsByName,
}: {
  students: PrintableStudent[]
  classes: PrintableClass[]
  scope: 'school' | 'class' | 'teacher'
  classId: string
  teacherName: string
  setupAssignments: Record<string, unknown>
  additionalClassIdsByStudent: Record<string | number, string[]>
  teacherAssignedStudentIdsByName: Map<string, Set<number>>
}) {
  const activeStudents = students.filter(student => student.is_active !== false)
  if (scope === 'school') return activeStudents
  if (scope === 'class') return activeStudents.filter(student => studentBelongsToClass(student, classId, additionalClassIdsByStudent))

  const normalizedTeacherName = normalizeName(teacherName)
  const classIds = new Set(classes
    .filter(entry => normalizeName(entry.teacher) === normalizedTeacherName)
    .map(entry => String(entry.id)))
  const assignedStudentIds = new Set([
    ...getTeacherAssignedStudentIds(teacherName, setupAssignments),
    ...(teacherAssignedStudentIdsByName.get(normalizedTeacherName) || new Set<number>()),
  ].map(Number))

  return activeStudents.filter(student =>
    assignedStudentIds.has(Number(student.id))
    || Array.from(classIds).some(assignedClassId => studentBelongsToClass(student, assignedClassId, additionalClassIdsByStudent)),
  )
}