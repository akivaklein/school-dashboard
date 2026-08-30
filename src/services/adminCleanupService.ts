import { supabase } from '../supabaseClient'

// Admin-only bulk cleanup of TEST DATA history. Students, staff, users,
// assignments, and setup configuration are never touched by these actions.
// Each action must be explicitly invoked from the UI behind a typed
// confirmation phrase — nothing here runs automatically.

async function appendAuditLog(action: string, actorName: string, metadata: Record<string, unknown>) {
  await supabase
    .from('audit_logs')
    .insert({
      user_name: String(actorName || '').trim() || 'Admin',
      action,
      target_table: 'students',
      target_id: 'all',
      metadata,
    })
}

export type CleanupResult = {
  success: boolean
  error?: string
}

// Deletes every grade_entries row and clears the legacy students.test_scores
// JSONB field. Does not touch students, classes, assignments, or setup.
export async function clearGradesHistory(actorName: string): Promise<CleanupResult> {
  const { error: gradeEntriesError } = await supabase
    .from('grade_entries')
    .delete()
    .not('id', 'is', null)

  if (gradeEntriesError) {
    console.error('Error clearing grade_entries:', gradeEntriesError)
    return { success: false, error: gradeEntriesError.message }
  }

  const { error: studentsError } = await supabase
    .from('students')
    .update({ test_scores: [] })
    .not('id', 'is', null)

  if (studentsError) {
    console.error('Error clearing students.test_scores:', studentsError)
    return { success: false, error: studentsError.message }
  }

  await appendAuditLog('admin_clear_grades_history', actorName, {})
  return { success: true }
}

// Deletes every points_events row and resets students.token_balance,
// reminders, and behavior_log so the balances stay consistent with the
// (now empty) history. Does not touch students, classes, assignments, or setup.
export async function clearPointsHistory(actorName: string): Promise<CleanupResult> {
  const { error: pointsEventsError } = await supabase
    .from('points_events')
    .delete()
    .not('id', 'is', null)

  if (pointsEventsError) {
    console.error('Error clearing points_events:', pointsEventsError)
    return { success: false, error: pointsEventsError.message }
  }

  const { error: studentsError } = await supabase
    .from('students')
    .update({ token_balance: 0, reminders: 0, behavior_log: [] })
    .not('id', 'is', null)

  if (studentsError) {
    console.error('Error resetting students points/behavior fields:', studentsError)
    return { success: false, error: studentsError.message }
  }

  await appendAuditLog('admin_clear_points_history', actorName, {})
  return { success: true }
}
