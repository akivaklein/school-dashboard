import { supabase } from '../supabaseClient'

export type PointsEventRecord = {
  id: number
  created_at: string
  student_id: number
  student_name: string
  staff_id: string | null
  staff_name: string
  staff_role: string | null
  points_delta: number
  event_type: string
  category: string
  reason: string
  note: string | null
  source_page: string | null
  source_context: string | null
  related_event_id: number | null
  metadata: Record<string, unknown> | null
}

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

export type ApplyPointsEventTxInput = {
  studentId: number
  studentName?: string | null
  staffId?: string | null
  staffName: string
  staffRole?: string
  pointsDelta: number
  reminderDelta?: number
  eventType: string
  category: string
  reason: string
  note?: string | null
  sourcePage?: string | null
  sourceContext?: string | null
  relatedEventId?: number | null
  metadata?: Record<string, unknown>
}

export type ApplyPointsEventTxResult = {
  eventId: number
  studentId: number
  nextPoints: number
  nextReminders: number
}

export type ReversePointsEventTxResult = {
  reversalEventId: number
  targetEventId: number
  studentId: number
  nextPoints: number
  nextReminders: number
}

function toRequiredNumberField(
  payload: unknown,
  field: string,
  rpcName: string,
): number {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`Contract error from ${rpcName}: response payload is missing.`)
  }

  const value = (payload as Record<string, unknown>)[field]
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    throw new Error(`Contract error from ${rpcName}: required field ${field} is missing or invalid.`)
  }

  return numeric
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

export async function listPointsEventsForStudent(
  studentId: number,
): Promise<PointsEventRecord[]> {
  const { data, error } = await supabase
    .from('points_events')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw error

  return (data || []) as PointsEventRecord[]
}

export async function applyPointsEventTx(
  input: ApplyPointsEventTxInput,
): Promise<ApplyPointsEventTxResult> {
  const rpcName = 'apply_points_event_tx'
  const { data, error } = await supabase.rpc('apply_points_event_tx', {
    p_student_id: Number(input.studentId),
    p_student_name: input.studentName || null,
    p_staff_id: input.staffId || null,
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole || 'staff',
    p_points_delta: Number(input.pointsDelta || 0),
    p_reminder_delta: Number(input.reminderDelta || 0),
    p_event_type: input.eventType,
    p_category: input.category,
    p_reason: input.reason,
    p_note: input.note || null,
    p_source_page: input.sourcePage || null,
    p_source_context: input.sourceContext || null,
    p_related_event_id: input.relatedEventId || null,
    p_metadata: input.metadata || {},
  })

  if (error) throw error

  return {
    eventId: toRequiredNumberField(data, 'event_id', rpcName),
    studentId: toRequiredNumberField(data, 'student_id', rpcName),
    nextPoints: toRequiredNumberField(data, 'next_points', rpcName),
    nextReminders: toRequiredNumberField(data, 'next_reminders', rpcName),
  }
}

export async function reversePointsEventTx(input: {
  targetEventId: number
  staffName: string
  staffRole?: string
  note?: string | null
  sourceContext?: string | null
}): Promise<ReversePointsEventTxResult> {
  const rpcName = 'reverse_points_event_tx'
  const { data, error } = await supabase.rpc('reverse_points_event_tx', {
    p_target_event_id: Number(input.targetEventId),
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole || 'staff',
    p_note: input.note || null,
    p_source_context: input.sourceContext || 'history-undo',
  })

  if (error) throw error

  return {
    reversalEventId: toRequiredNumberField(data, 'reversal_event_id', rpcName),
    targetEventId: toRequiredNumberField(data, 'target_event_id', rpcName),
    studentId: toRequiredNumberField(data, 'student_id', rpcName),
    nextPoints: toRequiredNumberField(data, 'next_points', rpcName),
    nextReminders: toRequiredNumberField(data, 'next_reminders', rpcName),
  }
}