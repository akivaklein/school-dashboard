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
// (now empty) history. Safely clears foreign keys from store_redemptions
// to points_events before deletion to prevent constraint violations
// (store_redemptions_points_event_id_fkey) and preserve store redemption records.
// Does not touch students, classes, assignments, or setup.
export async function clearPointsHistory(actorName: string): Promise<CleanupResult> {
  const normalizedActor = String(actorName || '').trim() || 'Admin'

  // Attempt atomic database RPC first if available
  try {
    if (typeof (supabase as any)?.rpc === 'function') {
      const { data, error } = await supabase.rpc('clear_points_history_tx', {
        p_actor_name: normalizedActor,
      })
      if (!error && (data as any)?.success) {
        return { success: true }
      }
      if (error && !error.message?.includes('function') && !error.message?.includes('schema') && !error.message?.includes('Could not find')) {
        console.error('Error in clear_points_history_tx RPC:', error)
        return { success: false, error: error.message }
      }
    }
  } catch (err) {
    console.warn('RPC clear_points_history_tx unavailable, falling back to direct client sequence:', err)
  }

  // Fallback / direct client sequence:
  // 1) Disconnect store_redemptions foreign key references so redemption history is preserved
  //    and no FK constraint violation occurs when deleting points_events.
  const { error: redemptionsError } = await supabase
    .from('store_redemptions')
    .update({ points_event_id: null, reversal_event_id: null })
    .not('id', 'is', null)

  if (redemptionsError) {
    console.error('Error clearing store_redemptions foreign keys:', redemptionsError)
    return { success: false, error: redemptionsError.message }
  }

  // 2) Disconnect self-referencing related_event_id links on points_events.
  const { error: selfRefError } = await supabase
    .from('points_events')
    .update({ related_event_id: null })
    .not('id', 'is', null)

  if (selfRefError) {
    console.error('Error clearing points_events self-references:', selfRefError)
    return { success: false, error: selfRefError.message }
  }

  // 3) Delete points_events history.
  const { error: pointsEventsError } = await supabase
    .from('points_events')
    .delete()
    .not('id', 'is', null)

  if (pointsEventsError) {
    console.error('Error clearing points_events:', pointsEventsError)
    return { success: false, error: pointsEventsError.message }
  }

  // 4) Reset student point balances, reminder counts, and behavior logs.
  const { error: studentsError } = await supabase
    .from('students')
    .update({ token_balance: 0, reminders: 0, behavior_log: [] })
    .not('id', 'is', null)

  if (studentsError) {
    console.error('Error resetting students points/behavior fields:', studentsError)
    return { success: false, error: studentsError.message }
  }

  await appendAuditLog('admin_clear_points_history', normalizedActor, {})
  return { success: true }
}
