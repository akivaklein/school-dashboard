import { supabase } from '../supabaseClient'

// Additional (non-primary) class memberships. A student's primary/homeroom
// class still comes from student_class_assignments; this table lets a
// student belong to any number of OTHER classes at the same time
// (e.g. Gemara level, Math group, Reading group) without replacing it.

export type StudentAdditionalClass = {
  id: string
  student_id: number
  class_id: string
  class_name: string
  added_at: string
  added_by: string
}

export async function loadAdditionalClassMemberships(): Promise<StudentAdditionalClass[]> {
  const { data, error } = await supabase
    .from('student_additional_classes')
    .select('*')

  if (error) {
    console.error('Error loading student additional classes:', error)
    return []
  }
  return (data || []) as StudentAdditionalClass[]
}

export async function addStudentToClass(
  studentId: number,
  classId: string,
  className: string,
  actorName: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('student_additional_classes')
    .upsert(
      { student_id: studentId, class_id: classId, class_name: className, added_by: actorName },
      { onConflict: 'student_id,class_id' },
    )

  if (error) {
    console.error('Error adding student to class:', error)
    return false
  }
  return true
}

export async function removeStudentFromClass(studentId: number, classId: string): Promise<boolean> {
  const { error } = await supabase
    .from('student_additional_classes')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId)

  if (error) {
    console.error('Error removing student from class:', error)
    return false
  }
  return true
}

export async function addStudentsToClassBulk(
  studentIds: number[],
  classId: string,
  className: string,
  actorName: string,
): Promise<boolean> {
  if (!studentIds.length) return true
  const rows = studentIds.map(studentId => ({
    student_id: studentId,
    class_id: classId,
    class_name: className,
    added_by: actorName,
  }))

  const { error } = await supabase
    .from('student_additional_classes')
    .upsert(rows, { onConflict: 'student_id,class_id' })

  if (error) {
    console.error('Error bulk adding students to class:', error)
    return false
  }
  return true
}
