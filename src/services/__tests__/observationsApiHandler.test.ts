import { describe, expect, it, vi } from 'vitest'
import { createObservationsHandler } from '../../../api/student-support/observations'

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

describe('observations API', () => {
  it('forwards the caller JWT and scoped IDs through the anon client so RLS applies', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 4, student_id: 125 }], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const inMock = vi.fn().mockReturnValue({ eq })
    const select = vi.fn().mockReturnValue({ in: inMock })
    const from = vi.fn().mockReturnValue({ select })
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const rpc = vi.fn().mockResolvedValue({ data: 'admin', error: null, status: 200 })
    const createClient = vi.fn().mockReturnValue({ auth: { getUser }, rpc, from })
    const log = vi.fn()
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createObservationsHandler(createClient as never, log)({
      method: 'GET',
      headers: { 'x-supabase-access-token': 'caller-jwt' },
      query: { studentIds: '125,132,125' },
    }, response)

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'public-anon-key',
      expect.objectContaining({ global: { headers: { Authorization: 'Bearer caller-jwt' } } }),
    )
    expect(inMock).toHaveBeenCalledWith('student_id', [125, 132])
    expect(record).toMatchObject({ statusCode: 200, body: { data: [{ id: 4, student_id: 125 }] } })
    expect(getUser).toHaveBeenCalledWith('caller-jwt')
    expect(rpc).toHaveBeenCalledWith('dashboard_current_role')
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"resolvedRole":"admin"'))
  })

  it('rejects missing authentication without querying Supabase', async () => {
    const createClient = vi.fn()
    const { record, response } = responseRecorder()

    await createObservationsHandler(createClient as never)({
      method: 'GET',
      headers: {},
      query: { studentIds: '125' },
    }, response)

    expect(createClient).not.toHaveBeenCalled()
    expect(record).toMatchObject({ statusCode: 401, body: { error: 'A valid Supabase access token is required.' } })
  })

  it('returns the upstream RLS denial and never substitutes an empty result', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const inMock = vi.fn().mockReturnValue({ eq })
    const select = vi.fn().mockReturnValue({ in: inMock })
    const createClient = vi.fn().mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: 'admin', error: null, status: 200 }),
      from: vi.fn().mockReturnValue({ select }),
    })
    const { record, response } = responseRecorder()
    process.env.VITE_SUPABASE_YK_URL = 'https://project.supabase.co'
    process.env.VITE_SUPABASE_YK_ANON_KEY = 'public-anon-key'

    await createObservationsHandler(createClient as never)({
      method: 'GET',
      headers: { 'x-supabase-access-token': 'caller-jwt' },
      query: { studentIds: '125' },
    }, response)

    expect(record).toMatchObject({ statusCode: 403, body: { error: 'permission denied', code: '42501' } })
  })
})