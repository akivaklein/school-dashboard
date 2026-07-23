import { supabase } from '../supabaseClient'

export type CreatePointsEventInput = {
  studentId: number
  studentName: string
  staffId?: string | null
  staffName: string
  staffRole?: string
  pointsDelta: number
  eventType: string
  category: string
  reason: string
  note?: string | null
  sourcePage?: string | null
  sourceContext?: string | null
  relatedEventId?: number | null
  metadata?: Record<string, unknown>
}

export async function createPointsEvent(
  input: CreatePointsEventInput,
): Promise<number> {
  const { data, error } = await supabase
    .from('points_events')
    .insert({
      student_id: input.studentId,
      student_name: input.studentName,
      staff_id: input.staffId || null,
      staff_name: input.staffName,
      staff_role: input.staffRole || 'staff',
      points_delta: input.pointsDelta,
      event_type: input.eventType,
      category: input.category,
      reason: input.reason,
      note: input.note || null,
      source_page: input.sourcePage || null,
      source_context: input.sourceContext || null,
      related_event_id: input.relatedEventId || null,
      metadata: input.metadata || {},
    })
    .select('id')
    .single()

  if (error) throw error
  return Number(data.id)
}

export async function deletePointsEvent(id: number): Promise<void> {
  const { error } = await supabase
    .from('points_events')
    .delete()
    .eq('id', id)

  if (error) throw error
}