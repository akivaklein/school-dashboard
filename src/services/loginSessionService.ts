import { supabase } from '../supabaseClient'

export interface LoginSession {
  id: number
  staff_id: number
  staff_name: string
  role: string
  login_time: string
  logout_time?: string
  session_duration_seconds?: number
}

export async function recordLoginSession(staffId: number, staffName: string, role: string) {
  try {
    const { data, error } = await supabase
      .from('login_sessions')
      .insert([
        {
          staff_id: staffId,
          staff_name: staffName,
          role: role,
          login_time: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      console.error('Failed to record login session:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error recording login session:', error)
    return null
  }
}

export async function recordLogoutSession(sessionId: number) {
  try {
    const { data: sessionData, error: fetchError } = await supabase
      .from('login_sessions')
      .select('login_time')
      .eq('id', sessionId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch session:', fetchError)
      return false
    }

    const loginTime = new Date(sessionData.login_time).getTime()
    const logoutTime = new Date().getTime()
    const durationSeconds = Math.floor((logoutTime - loginTime) / 1000)

    const { error: updateError } = await supabase
      .from('login_sessions')
      .update({
        logout_time: new Date().toISOString(),
        session_duration_seconds: durationSeconds
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to record logout:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error recording logout session:', error)
    return false
  }
}

export async function getLoginHistory(staffId?: number, days = 30) {
  try {
    let query = supabase
      .from('login_sessions')
      .select('*')
      .gte('login_time', new Date(Date.now() - days * 86400000).toISOString())
      .order('login_time', { ascending: false })

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to get login history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting login history:', error)
    return []
  }
}

export async function getLoginStats(days = 30) {
  try {
    const { data, error } = await supabase
      .from('login_sessions')
      .select('staff_id, staff_name, role, login_time, logout_time, session_duration_seconds')
      .gte('login_time', new Date(Date.now() - days * 86400000).toISOString())

    if (error) {
      console.error('Failed to get login stats:', error)
      return {}
    }

    const stats: Record<string, any> = {}
    const seenSessionIds: Record<string, boolean> = {}

    (data || []).forEach(session => {
      const staffId = session.staff_id != null ? Number(session.staff_id) : null
      const stableStaffKey = staffId != null
        ? `staff-${staffId}`
        : `staff-${String(session.staff_name || 'unknown-staff').trim().toLowerCase()}`
      const staffName = session.staff_name || 'Unknown staff'

      if (!stats[stableStaffKey]) {
        stats[stableStaffKey] = {
          key: stableStaffKey,
          name: staffName,
          role: session.role,
          loginCount: 0,
          totalSessionSeconds: 0,
          avgSessionSeconds: 0,
          sessionsWithDuration: 0,
          activeSessions: 0,
        }
      }

      stats[stableStaffKey].loginCount += 1

      const hasStoredDuration =
        typeof session.session_duration_seconds === 'number' &&
        Number.isFinite(session.session_duration_seconds)

      let sessionDurationSeconds = hasStoredDuration
        ? Math.max(0, Math.round(session.session_duration_seconds))
        : 0

      const sessionId = Number(session.id)
      const sessionIdKey = Number.isFinite(sessionId) ? String(sessionId) : null
      const isDuplicateSession = sessionIdKey ? seenSessionIds[sessionIdKey] : false
      if (!isDuplicateSession && !hasStoredDuration && !session.logout_time) {
        const loginMs = new Date(session.login_time).getTime()
        if (Number.isFinite(loginMs)) {
          sessionDurationSeconds = Math.max(
            0,
            Math.floor((Date.now() - loginMs) / 1000)
          )
          stats[stableStaffKey].activeSessions += 1
        }
      }

      if (sessionIdKey) {
        seenSessionIds[sessionIdKey] = true
      }

      stats[stableStaffKey].totalSessionSeconds += sessionDurationSeconds

      if (sessionDurationSeconds > 0) {
        stats[stableStaffKey].sessionsWithDuration += 1
      }
    })

    Object.values(stats).forEach((stat: any) => {
      stat.avgSessionSeconds = stat.sessionsWithDuration > 0
        ? Math.round(stat.totalSessionSeconds / stat.sessionsWithDuration)
        : 0
    })

    return stats
  } catch (error) {
    console.error('Error getting login stats:', error)
    return {}
  }
}
