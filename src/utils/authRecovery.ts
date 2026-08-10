export type AuthMode = 'sign-in' | 'forgot-password'

export function normalizeAppOrigin(input: string | undefined | null): string {
  const configured = String(input || '').trim()
  if (!configured) return ''
  return configured.replace(/\/$/, '')
}

export function getPasswordResetRedirectUrl(input: {
  configuredAppUrl?: string | null
  currentOrigin?: string | null
  fallbackOrigin?: string | null
  isProduction?: boolean
}): string {
  const configured = normalizeAppOrigin(input.configuredAppUrl)
  const currentOrigin = normalizeAppOrigin(input.currentOrigin)
  const fallbackOrigin = normalizeAppOrigin(input.fallbackOrigin)
  const resolvedOrigin = configured || currentOrigin || fallbackOrigin || ''

  const candidate = resolvedOrigin || ''
  if (!candidate) return '/reset-password'

  if (/^https?:\/\//i.test(candidate)) {
    const isLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(candidate)
    if (isLocalhost) {
      const fallback = fallbackOrigin || 'https://yeshiva-ketana-secure.vercel.app'
      return `${fallback}/reset-password`
    }

    return `${candidate.replace(/\/$/, '')}/reset-password`
  }

  return `${candidate.replace(/\/$/, '')}/reset-password`
}

export function buildPasswordResetRedirectUrl(input: {
  configuredAppUrl?: string | null
  currentOrigin?: string | null
  fallbackOrigin?: string | null
  isProduction?: boolean
}) {
  return getPasswordResetRedirectUrl(input)
}

export function getRecoveryModeFromUrl(input: {
  pathname?: string | null
  search?: string | null
  hash?: string | null
}): AuthMode {
  const hash = String(input.hash || '')
  const search = String(input.search || '')
  const raw = `${hash}&${search}`.toLowerCase()
  return raw.includes('type=recovery') ? 'forgot-password' : 'sign-in'
}

export function hasRecoveryTokens(input: {
  search?: string | null
  hash?: string | null
}): boolean {
  const hash = String(input.hash || '')
  const search = String(input.search || '')
  const raw = `${hash}&${search}`.toLowerCase()
  return raw.includes('type=recovery') || raw.includes('access_token=') || raw.includes('refresh_token=') || raw.includes('code=')
}

export function shouldShowPasswordResetPage(input: {
  pathname?: string | null
  search?: string | null
  hash?: string | null
  resetReady?: boolean
  isAuthenticated?: boolean
}) {
  const pathname = String(input.pathname || '')
  const isResetRoute = pathname === '/reset-password'

  return Boolean(isResetRoute || input.resetReady || hasRecoveryTokens({ search: input.search, hash: input.hash }))
}

export function getPasswordResetErrorMessage(message: string | null | undefined): string {
  const normalized = String(message || '').trim().toLowerCase()
  if (!normalized) return 'This password reset link is invalid, expired, or already used. Request a new reset email.'
  if (/expired|invalid|jwt|token|session|already used/i.test(normalized)) {
    return 'This password reset link is invalid, expired, or already used. Request a new reset email.'
  }
  return message || 'Unable to set new password.'
}
