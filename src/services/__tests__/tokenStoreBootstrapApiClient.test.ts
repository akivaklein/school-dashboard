import { describe, expect, it, vi } from 'vitest'
import { fetchTokenStoreBootstrapFromSameOrigin } from '../tokenStoreBootstrapApiClient'

describe('same-origin Token Store bootstrap client', () => {
  it('sends the session JWT and returns both initial datasets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ id: 1, name: 'Item' }],
      redemptions: [{ id: 2, item_name: 'Item' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await expect(fetchTokenStoreBootstrapFromSameOrigin('session-jwt', fetchMock)).resolves.toEqual({
      items: [{ id: 1, name: 'Item' }],
      redemptions: [{ id: 2, item_name: 'Item' }],
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/token-store/bootstrap', {
      method: 'GET',
      cache: 'no-store',
      headers: { 'X-Supabase-Access-Token': 'session-jwt' },
    })
  })

  it('surfaces the failing table, status, code, and request ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'permission denied for table store_redemptions',
      code: '42501',
      stage: 'store_redemptions',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'X-Token-Store-Request-Id': 'request-123' },
    }))

    await expect(fetchTokenStoreBootstrapFromSameOrigin('session-jwt', fetchMock))
      .rejects.toThrow('Token Store API [store_redemptions] HTTP 403 (42501): permission denied for table store_redemptions; requestId=request-123')
  })
})