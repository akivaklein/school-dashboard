export async function fetchObservationsFromSameOrigin(
  studentIds: number[],
  accessToken: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<Array<Record<string, unknown>>> {
  const query = new URLSearchParams({ studentIds: studentIds.join(',') })
  const response = await fetchImplementation(`/api/student-support/observations?${query}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'X-Supabase-Access-Token': accessToken,
    },
  })

  const payload = await response.json().catch(() => ({})) as {
    data?: Array<Record<string, unknown>>
    error?: string
    code?: string | null
  }
  if (!response.ok) {
    const code = payload.code ? ` (${payload.code})` : ''
    const requestId = response.headers.get('x-student-support-request-id')
    const requestLabel = requestId ? `; requestId=${requestId}` : ''
    throw new Error(`Observations API HTTP ${response.status}${code}: ${payload.error || response.statusText || 'Request failed'}${requestLabel}`)
  }

  return Array.isArray(payload.data) ? payload.data : []
}