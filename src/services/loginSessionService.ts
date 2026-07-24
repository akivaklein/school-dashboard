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
      .select('staff_name, role, session_duration_seconds')
      .gte('login_time', new Date(Date.now() - days * 86400000).toISOString())

    if (error) {
      console.error('Failed to get login stats:', error)
      return {}
    }

    const stats: Record<string, any> = {}

    (data || []).forEach(session => {
      if (!stats[session.staff_name]) {
        stats[session.staff_name] = {
          name: session.staff_name,
          role: session.role,
          loginCount: 0,
          totalSessionSeconds: 0,
          avgSessionSeconds: 0
        }
      }

      stats[session.staff_name].loginCount += 1
      stats[session.staff_name].totalSessionSeconds += session.session_duration_seconds || 0
    })

    // Calculate averages
    Object.values(stats).forEach((stat: any) => {
      stat.avgSessionSeconds = Math.round(stat.totalSessionSeconds / stat.loginCount)
    })

    return stats
  } catch (error) {
    console.error('Error getting login stats:', error)
    return {}
  }
}
