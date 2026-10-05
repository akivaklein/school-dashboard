import { supabase } from '../supabaseClient'
import { calculateAge, localDateKey, validateShachrisConfig, type ShachrisAssignment, type ShachrisConfig, type ShachrisRecord } from '../utils/shachris'

export type ShachrisSettings = { config: ShachrisConfig; revision: number }
export type ShachrisSession = { id: string; session_date: string; config: ShachrisConfig }

export async function loadShachrisSettings(): Promise<ShachrisSettings> {
  const { data, error } = await supabase.from('shachris_settings').select('config,revision').single()
  if (error) throw error
  return data as ShachrisSettings
}

export async function openShachrisSession(date: string, studentIds: number[]): Promise<{ session: ShachrisSession; records: ShachrisRecord[] }> {
  const { data, error } = await supabase.rpc('shachris_open_session', { p_date: date, p_student_ids: studentIds })
  if (error) throw error
  return data as { session: ShachrisSession; records: ShachrisRecord[] }
}

export async function saveShachrisRecords(sessionId: string, records: ShachrisRecord[], actorName: string): Promise<ShachrisRecord[]> {
  if (!records.length) return []
  const { data, error } = await supabase.rpc('shachris_save_records', {
    p_session_id: sessionId,
    p_records: records.map(record => ({ student_id: record.student_id, presence: record.presence, said_section_ids: record.said_section_ids, rating_id: record.rating_id, note: record.note, revision: record.revision })),
    p_actor_name: actorName,
  })
  if (error) throw error
  return data as ShachrisRecord[]
}

export async function saveShachrisExpectation(input: {
  studentId: number; mode: 'manual' | 'default'; milestoneId: string; sectionIds: string[] | null;
  reason: string; actorName: string; session: ShachrisSession; revision: number;
}): Promise<{ assignment: ShachrisAssignment; record: ShachrisRecord }> {
  if (input.session.session_date !== localDateKey()) throw new Error('Progression changes are available for today only. Historical expectations stay unchanged.')
  const { data, error } = await supabase.rpc('shachris_set_expectation', {
    p_student_id: input.studentId, p_mode: input.mode, p_milestone_id: input.milestoneId,
    p_section_ids: input.sectionIds, p_reason: input.reason.trim(), p_actor_name: input.actorName,
    p_effective_date: input.session.session_date, p_session_id: input.session.id, p_record_revision: input.revision,
  })
  if (error) throw error
  return data as { assignment: ShachrisAssignment; record: ShachrisRecord }
}

export async function loadShachrisProgression(studentId: number): Promise<ShachrisAssignment[]> {
  const { data, error } = await supabase.from('shachris_expectations').select('*').eq('student_id', studentId).order('effective_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as ShachrisAssignment[]
}

export async function saveShachrisSettings(settings: ShachrisSettings): Promise<ShachrisSettings> {
  const validation = validateShachrisConfig(settings.config)
  if (validation) throw new Error(validation)
  const { data, error } = await supabase.rpc('shachris_save_settings', { p_config: settings.config, p_revision: settings.revision })
  if (error) throw error
  return data as ShachrisSettings
}

export async function saveStudentDob(studentId: number | string, dob: string | null): Promise<void> {
  if (dob && calculateAge(dob) === null) throw new Error('Enter a valid date of birth that is not in the future.')
  const { data, error } = await supabase.from('students').update({ date_of_birth: dob }).eq('id', studentId).select('id,date_of_birth').single()
  if (error) throw error
  if (data.date_of_birth !== dob) throw new Error('The date of birth was not saved. Reload and try again.')
}