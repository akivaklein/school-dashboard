import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

function loadServiceWorker(fetchMock = vi.fn()) {
  const listeners: Record<string, Function> = {}
  const cached = new Map<string, Response>()
  const put = vi.fn(async (request: Request | string, response: Response) => {
    cached.set(typeof request === 'string' ? request : request.url, response)
  })
  const appClient = { url: 'https://example.test/?page=store', navigate: vi.fn(async () => undefined) }
  const cacheApi = {
    keys: vi.fn(async () => ['old-cache']),
    delete: vi.fn(async () => true),
    match: vi.fn(async (request: Request | string) => cached.get(typeof request === 'string' ? request : request.url)),
    open: vi.fn(async () => ({
      put,
    })),
  }
  const context = {
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (type: string, handler: Function) => {
        listeners[type] = handler
      },
      clients: {
        claim: vi.fn(async () => undefined),
        matchAll: vi.fn(async () => [appClient]),
      },
    },
    caches: cacheApi,
    fetch: fetchMock,
    Response,
    Request,
    URL,
    Promise,
    Set,
  }

  vm.runInNewContext(
    fs.readFileSync(path.resolve(__dirname, '../../../public/sw.js'), 'utf8'),
    context,
  )

  return { listeners, cacheApi, cached, put, appClient }
}

describe('service worker fetch handling', () => {
  it('claims and reloads controlled app tabs on activation', async () => {
    const { listeners, cacheApi, appClient } = loadServiceWorker()
    let activationPromise: Promise<unknown> | null = null

    listeners.activate({
      waitUntil: (promise: Promise<unknown>) => { activationPromise = promise },
    })

    await activationPromise
    expect(cacheApi.delete).toHaveBeenCalledWith('old-cache')
    expect(appClient.navigate).toHaveBeenCalledWith('https://example.test/?page=store')
  })

  it('returns a valid 503 Response when a handled same-origin request fails without cache', async () => {
    const { listeners } = loadServiceWorker(vi.fn(async () => { throw new Error('offline') }))
    let responsePromise: Promise<Response> | null = null

    listeners.fetch({
      request: new Request('https://example.test/index.html'),
      respondWith: (promise: Promise<Response>) => { responsePromise = promise },
    })

    const response = await responsePromise
    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(503)
    await expect(response.text()).resolves.toBe('Network unavailable.')
  })

  it('does not intercept cross-origin auth/session requests', () => {
    const { listeners } = loadServiceWorker()
    const respondWith = vi.fn()

    listeners.fetch({
      request: new Request('https://project.supabase.co/auth/v1/token'),
      respondWith,
    })

    expect(respondWith).not.toHaveBeenCalled()
  })

  it('does not intercept non-GET requests', () => {
    const { listeners } = loadServiceWorker()
    const respondWith = vi.fn()

    listeners.fetch({
      request: new Request('https://example.test/api/session', { method: 'POST' }),
      respondWith,
    })

    expect(respondWith).not.toHaveBeenCalled()
  })

  it('does not intercept or cache authenticated same-origin API requests', () => {
    const { listeners } = loadServiceWorker()
    const respondWith = vi.fn()

    listeners.fetch({
      request: new Request('https://example.test/api/student-support/observations?studentIds=125', {
        headers: { 'X-Supabase-Access-Token': 'session-jwt' },
      }),
      respondWith,
    })

    expect(respondWith).not.toHaveBeenCalled()
  })

  it('does not cache hashed asset chunks that can keep stale app code alive', async () => {
    const { listeners, put } = loadServiceWorker(vi.fn(async () => new Response('chunk', { status: 200 })))
    let responsePromise: Promise<Response> | null = null

    listeners.fetch({
      request: new Request('https://example.test/assets/TokenStorePage-old.js'),
      respondWith: (promise: Promise<Response>) => { responsePromise = promise },
    })

    await responsePromise
    expect(put).not.toHaveBeenCalled()
  })
})
