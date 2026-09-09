import { describe, expect, it, vi } from 'vitest'
import { fetchObservationsFromSameOrigin } from '../observationsApiClient'

describe('same-origin observations client', () => {
  it('avoids the failing cross-origin Supabase request and sends the session JWT', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 9, student_id: 125, note: 'Persisted observation' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await expect(fetchObservationsFromSameOrigin([125, 132], 'session-jwt', fetchMock)).resolves.toEqual([
      { id: 9, student_id: 125, note: 'Persisted observation' },
    ])

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/student-support/observations?studentIds=125%2C132',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: { 'X-Supabase-Access-Token': 'session-jwt' },
      }),
    )
  })

  it('surfaces API authorization errors instead of returning no observations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'permission denied for table student_notes',
      code: '42501',
    }), { status: 403, headers: { 'Content-Type': 'application/json', 'X-Student-Support-Request-Id': 'request-123' } }))

    await expect(fetchObservationsFromSameOrigin([125], 'session-jwt', fetchMock))
      .rejects.toThrow('Observations API HTTP 403 (42501): permission denied for table student_notes; requestId=request-123')
  })
})