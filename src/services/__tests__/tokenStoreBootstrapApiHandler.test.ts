import { describe, expect, it, vi } from 'vitest'
import { createTokenStoreBootstrapHandler } from '../../../api/token-store/bootstrap'

function responseRecorder() {
  const record = { statusCode: 200, body: null as unknown, headers: {} as Record<string, string> }
  return {
    record,
    response: {
      status(statusCode: number) { record.statusCode = statusCode; return this },
      json(body: unknown) { record.body = body },
      setHeader(name: string, value: string) { record.headers[name] = value },
    },
  }
}

function queryResult(result: Record<string, unknown>) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  return query
}

describe('Token Store bootstrap API', () => {
  it('allows preflight from the old branch host while canonical navigation catches up', async () => {
    const createClient = vi.fn()
    const { record, response } = responseRecorder()

    await createTokenStoreBootstrapHandler(createClient as never)({
      method: 'OPTIONS',
      headers: {
        origin: 'https://school-dashboard-git-yeshiva-keta-e6b2e0-akiva-klein-s-projects.vercel.app',
      },
    }, response)

    expect(createClient).not.toHaveBeenCalled()
    expect(record).toMatchObject({
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://school-dashboard-git-yeshiva-keta-e6b2e0-akiva-klein-s-projects.vercel.app',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  })

  it('forwards the caller JWT and reads both tables with RLS enabled', async () => {
    const items = queryResult({ data: [{ id: 1, name: 'Item' }], error: null, status: 200 })
    const redemptions = queryResult({ data: [{ id: 2, item_name: 'Item' }], error: null, status: 200 })
    const createClient = vi.fn().mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: 'register', error: null, status: 200 }),
      from: vi.fn((table: string) => table === 'store_items' ? items : redemptions),
    })
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createTokenStoreBootstrapHandler(createClient as never)({
      method: 'GET',
      headers: {
        'x-token-store-token': 'Y2Fsb.GVyLW.p3dA==',
      },
    }, response)

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'public-anon-key',
      expect.objectContaining({ global: { headers: { Authorization: 'Bearer caller-jwt' } } }),
    )
    expect(record).toMatchObject({
      statusCode: 200,
      body: { items: [{ id: 1, name: 'Item' }], redemptions: [{ id: 2, item_name: 'Item' }] },
    })
  })

  it('identifies store_items RLS failures and does not query redemptions', async () => {
    const items = queryResult({
      data: null,
      error: { code: '42501', message: 'permission denied for table store_items' },
      status: 403,
    })
    const from = vi.fn().mockReturnValue(items)
    const createClient = vi.fn().mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: 'register', error: null, status: 200 }),
      from,
    })
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createTokenStoreBootstrapHandler(createClient as never)({
      method: 'GET',
      headers: {
        'x-token-store-token': 'Y2Fsb.GVyLW.p3dA==',
      },
    }, response)

    expect(record).toMatchObject({
      statusCode: 403,
      body: { stage: 'store_items', code: '42501', resolvedRole: 'register' },
    })
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('accepts a JWT delivered in a POST body', async () => {
    const items = queryResult({ data: [{ id: 1, name: 'Item' }], error: null, status: 200 })
    const redemptions = queryResult({ data: [{ id: 2, item_name: 'Item' }], error: null, status: 200 })
    const createClient = vi.fn().mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: 'register', error: null, status: 200 }),
      from: vi.fn((table: string) => table === 'store_items' ? items : redemptions),
    })
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createTokenStoreBootstrapHandler(createClient as never)({
      method: 'POST',
      headers: {},
      body: { accessToken: 'Y2Fsb.GVyLW.p3dA==' },
    }, response)

    expect(record).toMatchObject({
      statusCode: 200,
      body: { items: [{ id: 1, name: 'Item' }], redemptions: [{ id: 2, item_name: 'Item' }] },
    })
  })

  it('rejects a missing JWT before querying Supabase', async () => {
    const createClient = vi.fn()
    const { record, response } = responseRecorder()

    await createTokenStoreBootstrapHandler(createClient as never)({ method: 'GET', headers: {} }, response)

    expect(createClient).not.toHaveBeenCalled()
    expect(record).toMatchObject({ statusCode: 401 })
  })

  it('does not decode malformed legacy-looking tokens into unsafe header values', async () => {
    const createClient = vi.fn().mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { status: 401, code: 'bad_jwt', message: 'invalid JWT' },
        }),
      },
    })
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createTokenStoreBootstrapHandler(createClient as never)({
      method: 'POST',
      headers: {},
      body: { accessToken: 'not-a-real-token' },
    }, response)

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'public-anon-key',
      expect.objectContaining({ global: { headers: { Authorization: 'Bearer not-a-real-token' } } }),
    )
    expect(record).toMatchObject({ statusCode: 401, body: { stage: 'auth', code: 'bad_jwt' } })
  })
})