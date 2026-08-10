import { describe, expect, it } from 'vitest'
import {
  buildPasswordResetRedirectUrl,
  getRecoveryModeFromUrl,
  getPasswordResetErrorMessage,
  shouldShowPasswordResetPage,
} from '../authRecovery'

describe('authRecovery helpers', () => {
  it('does not use localhost for password reset redirects in deployed environments', () => {
    const redirectUrl = buildPasswordResetRedirectUrl({
      configuredAppUrl: 'http://localhost:3000',
      currentOrigin: 'https://project-zpws3-e9ivj82yj-akiva-klein-s-projects.vercel.app',
      isProduction: true,
      fallbackOrigin: 'https://project-zpws3-e9ivj82yj-akiva-klein-s-projects.vercel.app',
    })

    expect(redirectUrl).toBe('https://project-zpws3-e9ivj82yj-akiva-klein-s-projects.vercel.app/reset-password')
  })

  it('treats recovery URLs as reset pages', () => {
    const mode = getRecoveryModeFromUrl({
      pathname: '/dashboard',
      search: '?type=recovery&access_token=abc&refresh_token=def',
      hash: '',
    })

    expect(mode).toBe('forgot-password')
    expect(shouldShowPasswordResetPage({ pathname: '/dashboard', search: '?type=recovery&access_token=abc&refresh_token=def', hash: '', resetReady: false, isAuthenticated: true })).toBe(true)
  })

  it('lets recovery routing win over normal dashboard routing', () => {
    expect(shouldShowPasswordResetPage({ pathname: '/dashboard', search: '?type=recovery', hash: '', resetReady: false, isAuthenticated: true })).toBe(true)
    expect(shouldShowPasswordResetPage({ pathname: '/dashboard', search: '', hash: '', resetReady: false, isAuthenticated: true })).toBe(false)
  })

  it('returns a clear error for expired or invalid recovery links', () => {
    expect(getPasswordResetErrorMessage('Invalid or expired recovery link')).toBe('This password reset link is invalid, expired, or already used. Request a new reset email.')
  })
})
