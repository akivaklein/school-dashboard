import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

type RequestLike = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type ResponseLike = {
  status: (statusCode: number) => ResponseLike
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

const ALLOWED_CORS_ORIGINS = new Set([
  'https://yeshiva-ketana-secure.vercel.app',
  'https://school-dashboard-git-yeshiva-keta-e6b2e0-akiva-klein-s-projects.vercel.app',
])

function getHeaderValue(headers: RequestLike['headers'], name: string): string {
  const headerValue = headers[name] || headers[name.toLowerCase()]
  return Array.isArray(headerValue) ? headerValue[0] || '' : headerValue || ''
}

function applyCorsHeaders(request: RequestLike, response: ResponseLike) {
  const origin = getHeaderValue(request.headers, 'origin')
  if (!ALLOWED_CORS_ORIGINS.has(origin)) return

  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Vary', 'Origin')
}

function upstreamStatus(status: number, code?: string): number {
  if (status >= 400) return status
  return code === '42501' ? 403 : 400
}

function normalizeAccessToken(value: string | null | undefined): string {
  const candidate = typeof value === 'string' ? value.trim() : ''
  if (!candidate) return ''

  if (candidate.split('.').length === 3 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(candidate)) {
    return candidate
  }

  const compactCandidate = candidate.split('.').join('')
  try {
    const decoded = Buffer.from(compactCandidate, 'base64').toString('utf8')
    if (decoded && /^[\x21-\x7E]+$/.test(decoded)) return decoded
  } catch {
    // fall through to the raw value below
  }

  return candidate
}

function isHeaderSafeToken(value: string): boolean {
  return /^[\x21-\x7E]+$/.test(value)
}

export function createTokenStoreBootstrapHandler(createSupabaseClient = createClient, log = console.info) {
  return async function tokenStoreBootstrapHandler(request: RequestLike, response: ResponseLike) {
    const requestId = randomUUID()
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Token-Store-Request-Id', requestId)
    applyCorsHeaders(request, response)

    if (request.method === 'OPTIONS') {
      response.status(204).json(null)
      return
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST, OPTIONS')
      response.status(405).json({ error: 'Method not allowed.' })
      return
    }

    const headerToken = getHeaderValue(request.headers, 'x-token-store-token')
    const bodyToken = typeof request.body === 'string'
      ? request.body
      : request.body && typeof request.body === 'object' && 'accessToken' in request.body
        ? String((request.body as { accessToken?: string }).accessToken || '')
        : ''
    const accessToken = normalizeAccessToken(bodyToken || headerToken)
    const diagnostics: Record<string, unknown> = {
      requestId,
      jwtPresent: Boolean(accessToken),
    }
    if (!accessToken || /\s/.test(accessToken) || !isHeaderSafeToken(accessToken)) {
      log(JSON.stringify({ ...diagnostics, stage: 'request-validation', outcome: 'rejected' }))
      response.status(401).json({ error: 'A valid Supabase access token is required.', requestId })
      return
    }

    const supabaseUrl = process.env.VITE_SUPABASE_YK_URL || ''
    const anonKey = process.env.VITE_SUPABASE_YK_ANON_KEY || ''
    if (!supabaseUrl || !anonKey) {
      response.status(500).json({ error: 'Token Store API is not configured.', requestId })
      return
    }

    const client = createSupabaseClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const authResult = await client.auth.getUser(accessToken)
    const authenticatedUserId = authResult.data.user?.id || null
    diagnostics.authStatus = authResult.error?.status || (authResult.data.user ? 200 : 401)
    diagnostics.authErrorCode = authResult.error?.code || null
    diagnostics.jwtValid = Boolean(authResult.data.user)
    diagnostics.authenticatedUserId = authenticatedUserId
    if (authResult.error || !authResult.data.user) {
      log(JSON.stringify({ ...diagnostics, stage: 'supabase-auth', outcome: 'rejected' }))
      response.status(401).json({
        error: authResult.error?.message || 'Supabase did not accept the session token.',
        code: authResult.error?.code || null,
        stage: 'auth',
        requestId,
      })
      return
    }

    const roleResult = await client.rpc('dashboard_current_role')
    diagnostics.roleStatus = roleResult.status
    diagnostics.roleErrorCode = roleResult.error?.code || null
    diagnostics.resolvedRole = roleResult.error ? null : roleResult.data

    const itemsResult = await client
      .from('store_items')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    diagnostics.storeItemsStatus = itemsResult.status
    diagnostics.storeItemsErrorCode = itemsResult.error?.code || null
    if (itemsResult.error) {
      log(JSON.stringify({ ...diagnostics, stage: 'store_items', outcome: 'rejected' }))
      response.status(upstreamStatus(itemsResult.status, itemsResult.error.code)).json({
        error: itemsResult.error.message || 'Unable to load store items.',
        code: itemsResult.error.code || null,
        details: itemsResult.error.details || null,
        hint: itemsResult.error.hint || null,
        stage: 'store_items',
        requestId,
        resolvedRole: diagnostics.resolvedRole,
      })
      return
    }

    const redemptionsResult = await client
      .from('store_redemptions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(500)
    diagnostics.storeRedemptionsStatus = redemptionsResult.status
    diagnostics.storeRedemptionsErrorCode = redemptionsResult.error?.code || null
    if (redemptionsResult.error) {
      log(JSON.stringify({ ...diagnostics, stage: 'store_redemptions', outcome: 'rejected' }))
      response.status(upstreamStatus(redemptionsResult.status, redemptionsResult.error.code)).json({
        error: redemptionsResult.error.message || 'Unable to load store redemptions.',
        code: redemptionsResult.error.code || null,
        details: redemptionsResult.error.details || null,
        hint: redemptionsResult.error.hint || null,
        stage: 'store_redemptions',
        requestId,
        resolvedRole: diagnostics.resolvedRole,
      })
      return
    }

    log(JSON.stringify({
      ...diagnostics,
      stage: 'complete',
      outcome: 'success',
      storeItemCount: itemsResult.data?.length || 0,
      storeRedemptionCount: redemptionsResult.data?.length || 0,
    }))
    response.status(200).json({
      items: itemsResult.data || [],
      redemptions: redemptionsResult.data || [],
      requestId,
      diagnostics: {
        requestId,
        stage: 'complete',
        authenticatedUserId,
        resolvedRole: diagnostics.resolvedRole,
        storeItemCount: itemsResult.data?.length || 0,
        storeRedemptionCount: redemptionsResult.data?.length || 0,
      },
    })
  }
}

export default createTokenStoreBootstrapHandler()