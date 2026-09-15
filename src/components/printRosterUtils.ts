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

export function getPrintableTeacherClassOptions(classes: PrintableClass[], teacherName: string) {
  const normalizedTeacherName = normalizeName(teacherName)
  return classes.filter(entry => normalizeName(entry.teacher) === normalizedTeacherName)
}

export function getPrintableRoster({
  students,
  classes,
  scope,
  classId,
  teacherName,
  teacherClassId,
  setupAssignments,
  additionalClassIdsByStudent,
  teacherAssignedStudentIdsByName,
}: {
  students: PrintableStudent[]
  classes: PrintableClass[]
  scope: 'school' | 'class' | 'teacher'
  classId: string
  teacherName: string
  teacherClassId?: string
  setupAssignments: Record<string, unknown>
  additionalClassIdsByStudent: Record<string | number, string[]>
  teacherAssignedStudentIdsByName: Map<string, Set<number>>
}) {
  const activeStudents = students.filter(student => student.is_active !== false)
  if (scope === 'school') return activeStudents
  if (scope === 'class') return activeStudents.filter(student => studentBelongsToClass(student, classId, additionalClassIdsByStudent))

  const normalizedTeacherName = normalizeName(teacherName)
  const teacherClasses = getPrintableTeacherClassOptions(classes, teacherName)
  const classIds = new Set(teacherClasses.map(entry => String(entry.id)))
  const assignedStudentIds = new Set([
    ...getTeacherAssignedStudentIds(teacherName, setupAssignments),
    ...(teacherAssignedStudentIdsByName.get(normalizedTeacherName) || new Set<number>()),
  ].map(Number))

  const teacherStudents = activeStudents.filter(student =>
    assignedStudentIds.has(Number(student.id))
    || Array.from(classIds).some(assignedClassId => studentBelongsToClass(student, assignedClassId, additionalClassIdsByStudent)),
  )
  if (!teacherClassId) return []
  if (teacherClassId === 'all') return teacherStudents
  return teacherStudents.filter(student => studentBelongsToClass(student, teacherClassId, additionalClassIdsByStudent))
}