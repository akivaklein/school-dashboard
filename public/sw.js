const CACHE_NAME = 'yk-secure-shell-v2'
const APP_SHELL_PATHS = new Set(['/', '/index.html', '/manifest.webmanifest'])

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  )
})

function isSameOriginRequest(requestUrl) {
  return requestUrl.origin === self.location.origin
}

function isAppNavigationRequest(event, requestUrl) {
  return event.request.mode === 'navigate' || APP_SHELL_PATHS.has(requestUrl.pathname)
}

function shouldBypassServiceWorker(event) {
  const request = event.request
  const requestUrl = new URL(request.url)

  if (request.method !== 'GET') return true
  if (!isSameOriginRequest(requestUrl)) return true
  if (requestUrl.pathname === '/sw.js') return true
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return true
  return false
}

async function networkFirstWithCacheFallback(event) {
  const request = event.request

  try {
    const response = await fetch(request)

    if (response && response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone()).catch(() => undefined)
    }

    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    const requestUrl = new URL(request.url)
    if (isAppNavigationRequest(event, requestUrl)) {
      const cachedShell = await caches.match('/index.html') || await caches.match('/')
      if (cachedShell) return cachedShell
    }

    return new Response('Network unavailable.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', event => {
  if (shouldBypassServiceWorker(event)) return

  event.respondWith(networkFirstWithCacheFallback(event))
})
