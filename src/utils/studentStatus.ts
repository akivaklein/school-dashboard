import type { StaffMember, StudentLike } from '../types/supportSession'

export function supportStatusFor(staff: StaffMember, serviceType: string) {
  return staff.role === 'BT' || serviceType.toLowerCase().includes('bt')
    ? 'with-bt'
    : 'therapy'
}

export function endSessionStudentFields(returnLocation: string) {
  if (returnLocation === 'back-in-class') {
    return { status: 'present', withStaff: null }
  }

  if (returnLocation === 'dismissed') {
    return {
      status: 'left-early',
      dailyStatus: 'left-early',
      withStaff: null,
    }
  }

  return { status: 'unknown', withStaff: null }
}

export function mergeStudentFields(
  students: StudentLike[],
  studentId: StudentLike['id'],
  fields: Partial<StudentLike>,
) {
  return students.map(student =>
    Number(student.id) === Number(studentId)
      ? { ...student, ...fields }
      : student,
  )
}
