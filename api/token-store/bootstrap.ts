import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

type RequestLike = {
  method?: string
  headers: Record<string, string | string[] | undefined>
}

type ResponseLike = {
  status: (statusCode: number) => ResponseLike
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

function upstreamStatus(status: number, code?: string): number {
  if (status >= 400) return status
  return code === '42501' ? 403 : 400
}

export function createTokenStoreBootstrapHandler(createSupabaseClient = createClient, log = console.info) {
  return async function tokenStoreBootstrapHandler(request: RequestLike, response: ResponseLike) {
    const requestId = randomUUID()
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Token-Store-Request-Id', requestId)

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
    diagnostics.authStatus = authResult.error?.status || (authResult.data.user ? 200 : 401)
    diagnostics.authErrorCode = authResult.error?.code || null
    diagnostics.jwtValid = Boolean(authResult.data.user)
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
    })
  }
}

export default createTokenStoreBootstrapHandler()