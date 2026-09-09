import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

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

export function createObservationsHandler(createSupabaseClient = createClient, log = console.info) {
  return async function observationsHandler(request: RequestLike, response: ResponseLike) {
    const requestId = randomUUID()
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Student-Support-Request-Id', requestId)

    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET')
      response.status(405).json({ error: 'Method not allowed.' })
      return
    }

    const tokenValue = request.headers['x-supabase-access-token']
    const accessToken = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue || ''
    const diagnostics: Record<string, unknown> = {
      requestId,
      customHeaderReceived: Boolean(tokenValue),
      jwtPresent: Boolean(accessToken),
    }
    if (!accessToken || /\s/.test(accessToken)) {
      log(JSON.stringify({ ...diagnostics, stage: 'request-validation', outcome: 'rejected' }))
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
    const authResult = await client.auth.getUser(accessToken)
    diagnostics.authStatus = authResult.error?.status || (authResult.data.user ? 200 : 401)
    diagnostics.authErrorCode = authResult.error?.code || null
    diagnostics.jwtValid = Boolean(authResult.data.user)
    if (authResult.error || !authResult.data.user) {
      log(JSON.stringify({ ...diagnostics, stage: 'supabase-auth', outcome: 'rejected' }))
      response.status(401).json({
        error: authResult.error?.message || 'Supabase did not accept the session token.',
        code: authResult.error?.code || null,
        requestId,
      })
      return
    }

    const roleResult = await client.rpc('dashboard_current_role')
    diagnostics.roleStatus = roleResult.status
    diagnostics.roleErrorCode = roleResult.error?.code || null
    diagnostics.resolvedRole = roleResult.error ? null : roleResult.data

    const { data, error, status } = await client
      .from('student_notes')
      .select('*')
      .in('student_id', studentIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    diagnostics.notesStatus = status
    diagnostics.notesErrorCode = error?.code || null
    diagnostics.notesErrorMessage = error?.message || null
    diagnostics.studentIdCount = studentIds.length

    if (error) {
      log(JSON.stringify({ ...diagnostics, stage: 'student-notes', outcome: 'rejected' }))
      const statusCode = status >= 400 ? status : error.code === '42501' ? 403 : 400
      response.status(statusCode).json({
        error: error.message || 'Unable to load observations.',
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
        requestId,
        resolvedRole: diagnostics.resolvedRole,
      })
      return
    }

    log(JSON.stringify({ ...diagnostics, stage: 'student-notes', outcome: 'success', rowCount: data?.length || 0 }))
    response.status(200).json({ data: data || [] })
  }
}

export default createObservationsHandler()