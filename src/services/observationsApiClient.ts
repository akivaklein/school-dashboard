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
    throw new Error(`Observations API${code}: ${payload.error || `HTTP ${response.status}`}`)
  }

  return Array.isArray(payload.data) ? payload.data : []
}