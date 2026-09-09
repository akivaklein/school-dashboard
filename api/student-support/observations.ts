import { createClient } from '@supabase/supabase-js'

type RequestLike = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
}

type ResponseLike = {
  status: (statusCode: number) => ResponseLike
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

function parseStudentIds(value: string | string[] | undefined): number[] {
  const text = Array.isArray(value) ? value.join(',') : String(value || '')
  return Array.from(new Set(
    text
      .split(',')
      .map(Number)
      .filter(studentId => Number.isSafeInteger(studentId) && studentId > 0),
  ))
}

export function createObservationsHandler(createSupabaseClient = createClient) {
  return async function observationsHandler(request: RequestLike, response: ResponseLike) {
    response.setHeader('Cache-Control', 'no-store')

    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET')
      response.status(405).json({ error: 'Method not allowed.' })
      return
    }

    const tokenValue = request.headers['x-supabase-access-token']
    const accessToken = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue || ''
    if (!accessToken || /\s/.test(accessToken)) {
      response.status(401).json({ error: 'A valid Supabase access token is required.' })
      return
    }

    const studentIds = parseStudentIds(request.query.studentIds)
    if (studentIds.length === 0) {
      response.status(400).json({ error: 'At least one valid student ID is required.' })
      return
    }
    if (studentIds.length > 250) {
      response.status(400).json({ error: 'Too many student IDs requested.' })
      return
    }

    const supabaseUrl = process.env.VITE_SUPABASE_YK_URL || ''
    const anonKey = process.env.VITE_SUPABASE_YK_ANON_KEY || ''
    if (!supabaseUrl || !anonKey) {
      response.status(500).json({ error: 'Student Support API is not configured.' })
      return
    }

    const client = createSupabaseClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client
      .from('student_notes')
      .select('*')
      .in('student_id', studentIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      const statusCode = error.code === '42501' ? 403 : 400
      response.status(statusCode).json({
        error: error.message || 'Unable to load observations.',
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
      })
      return
    }

    response.status(200).json({ data: data || [] })
  }
}

export default createObservationsHandler()