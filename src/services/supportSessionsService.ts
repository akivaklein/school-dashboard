import { supabase } from '../supabaseClient'
import type {
  EndSupportSessionInput,
  StaffMember,
  StudentLike,
  SupportSession,
} from '../types/supportSession'
import { endSessionStudentFields, supportStatusFor } from '../utils/studentStatus'

export async function listSupportSessions(): Promise<SupportSession[]> {
  const { data, error } = await supabase
    .from('support_sessions')
    .select('*')
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data || []) as SupportSession[]
}

export async function startSupportSessionRecord(
  student: StudentLike,
  staff: StaffMember,
  serviceType: string,
): Promise<{ session: SupportSession; studentFields: Partial<StudentLike> }> {
  const status = supportStatusFor(staff, serviceType)

  const { data, error } = await supabase
    .from('support_sessions')
    .insert({
      student_id: student.id,
      student_name: student.name,
      staff_id: staff.id,
      staff_name: staff.name,
      service_type: serviceType,
    })
    .select()
    .single()

  if (error) throw error

  const studentFields = { status, withStaff: staff.id }
  const { error: studentError } = await supabase
    .from('students')
    .update(studentFields)
    .eq('id', student.id)

  if (studentError) {
    await supabase.from('support_sessions').delete().eq('id', data.id)
    throw studentError
  }

  return { session: data as SupportSession, studentFields }
}

export async function endSupportSessionRecord(
  session: SupportSession,
  input: EndSupportSessionInput,
): Promise<{
  endedAt: string
  studentFields: Partial<StudentLike>
}> {
  const endedAt = new Date().toISOString()
  const studentFields = endSessionStudentFields(input.returnLocation)

  const { error } = await supabase
    .from('support_sessions')
    .update({
      ended_at: endedAt,
      return_location: input.returnLocation,
      notes: input.notes || null,
      goal_worked_on: input.goalWorkedOn || null,
      student_response: input.studentResponse || null,
      follow_up_needed: input.followUpNeeded,
    })
    .eq('id', session.id)

  if (error) throw error

  const { error: studentError } = await supabase
    .from('students')
    .update(studentFields)
    .eq('id', session.student_id)

  if (studentError) throw studentError
  return { endedAt, studentFields }
}
