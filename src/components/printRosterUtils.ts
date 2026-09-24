import { CLASS_ID_BY_GRADE } from './dashboardData'
import { getInstructionalGroupStudentIds } from '../utils/instructionalGroupUtils'

type PrintableStudent = { id: string | number; name?: string; is_active?: boolean }
type PrintableClass = { id: string | number; name: string; teacher?: string }
type InstructionalGroup = { id: string; status?: string }
type InstructionalGroupMembership = { group_id: string; student_id: number }

function normalizeName(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function movePrintColumn<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return items
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, item)
  return nextItems
}

export function getPrintableTeacherNames(classes: PrintableClass[]) {
  return Array.from(new Set(classes.map(entry => String(entry.teacher || '').trim()).filter(Boolean))).sort()
}

export function getPrintableTeacherClassOptions(classes: PrintableClass[], teacherName: string) {
  const normalizedTeacherName = normalizeName(teacherName)
  return classes.filter(entry => normalizeName(entry.teacher) === normalizedTeacherName)
}

function getClassOrGroupRoster(students: PrintableStudent[], classOrGroupId: string, primaryClassIdsByStudent: Record<string | number, string>, additionalClassIdsByStudent: Record<string | number, string[]>, instructionalGroups: InstructionalGroup[], instructionalGroupMemberships: InstructionalGroupMembership[]) {
  const instructionalGroup = instructionalGroups.some(group => group.id === classOrGroupId && group.status !== 'archived')
  if (instructionalGroup) {
    const memberIds = new Set(getInstructionalGroupStudentIds(classOrGroupId, instructionalGroupMemberships))
    return students.filter(student => memberIds.has(Number(student.id)))
  }
  return students.filter(student => {
    const savedPrimaryClassId = primaryClassIdsByStudent[Number(student.id)] || primaryClassIdsByStudent[student.id]
    const hasAdditionalMembership = (additionalClassIdsByStudent[Number(student.id)] || additionalClassIdsByStudent[student.id] || []).includes(classOrGroupId)
    if (savedPrimaryClassId === classOrGroupId) return true
    if ((Object.values(CLASS_ID_BY_GRADE) as string[]).includes(classOrGroupId)) return false
    return hasAdditionalMembership
  })
}

export function getPrintableRoster({
  students,
  classes,
  scope,
  classId,
  teacherName,
  teacherClassId,
  primaryClassIdsByStudent = {},
  additionalClassIdsByStudent,
  instructionalGroups,
  instructionalGroupMemberships,
}: {
  students: PrintableStudent[]
  classes: PrintableClass[]
  scope: 'school' | 'class' | 'teacher'
  classId: string
  teacherName: string
  teacherClassId?: string
  primaryClassIdsByStudent?: Record<string | number, string>
  additionalClassIdsByStudent: Record<string | number, string[]>
  instructionalGroups: InstructionalGroup[]
  instructionalGroupMemberships: InstructionalGroupMembership[]
}) {
  const activeStudents = students.filter(student => student.is_active !== false)
  if (scope === 'school') return activeStudents
  if (scope === 'class') return getClassOrGroupRoster(activeStudents, classId, primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships)

  const teacherClasses = getPrintableTeacherClassOptions(classes, teacherName)
  if (!teacherClassId) return []
  if (teacherClassId === 'all') {
    const studentIds = new Set(teacherClasses.flatMap(classEntry => getClassOrGroupRoster(activeStudents, String(classEntry.id), primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships).map(student => String(student.id))))
    return activeStudents.filter(student => studentIds.has(String(student.id)))
  }
  return getClassOrGroupRoster(activeStudents, teacherClassId, primaryClassIdsByStudent, additionalClassIdsByStudent, instructionalGroups, instructionalGroupMemberships)
}