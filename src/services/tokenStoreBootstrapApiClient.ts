export type TokenStoreBootstrapRows = {
  items: Array<Record<string, unknown>>
  redemptions: Array<Record<string, unknown>>
}

export async function fetchTokenStoreBootstrapFromSameOrigin(
  accessToken: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<TokenStoreBootstrapRows> {
  const response = await fetchImplementation('/api/token-store/bootstrap', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'X-Supabase-Access-Token': accessToken,
    },
  })

  const payload = await response.json().catch(() => ({})) as {
    items?: Array<Record<string, unknown>>
    redemptions?: Array<Record<string, unknown>>
    error?: string
    code?: string | null
    stage?: string
  }
  if (!response.ok) {
    const stage = payload.stage ? ` [${payload.stage}]` : ''
    const code = payload.code ? ` (${payload.code})` : ''
    const requestId = response.headers.get('x-token-store-request-id')
    const requestLabel = requestId ? `; requestId=${requestId}` : ''
    throw new Error(`Token Store API${stage} HTTP ${response.status}${code}: ${payload.error || response.statusText || 'Request failed'}${requestLabel}`)
  }

  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    redemptions: Array.isArray(payload.redemptions) ? payload.redemptions : [],
  }
}