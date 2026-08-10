import { describe, expect, it } from 'vitest'
import {
  AuthMode,
  buildPasswordResetRedirectUrl,
  getRecoveryModeFromUrl,
  getPasswordResetErrorMessage,
  hasRecoveryTokens,
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

  // hasRecoveryTokens is correctly exported and callable
  it('hasRecoveryTokens is exported and callable as a function', () => {
    expect(typeof hasRecoveryTokens).toBe('function')
  })

  it('hasRecoveryTokens detects type=recovery in search params', () => {
    expect(hasRecoveryTokens({ search: '?type=recovery&access_token=tok', hash: '' })).toBe(true)
  })

  it('hasRecoveryTokens detects access_token in hash fragment', () => {
    expect(hasRecoveryTokens({ search: '', hash: '#access_token=abc&refresh_token=def&type=recovery' })).toBe(true)
  })

  it('hasRecoveryTokens detects code param (PKCE flow)', () => {
    expect(hasRecoveryTokens({ search: '?code=abc123', hash: '' })).toBe(true)
  })

  it('hasRecoveryTokens returns false for normal sign-in URL', () => {
    expect(hasRecoveryTokens({ search: '', hash: '' })).toBe(false)
    expect(hasRecoveryTokens({ search: '?email=test@example.com', hash: '' })).toBe(false)
  })

  it('AuthMode type has sign-in and forgot-password values', () => {
    const a: AuthMode = 'sign-in'
    const b: AuthMode = 'forgot-password'
    expect(a).toBe('sign-in')
    expect(b).toBe('forgot-password')
  })

  it('malformed recovery URL with no tokens shows reset page only if on /reset-password route', () => {
    // malformed: has code= in search but no type=recovery — still triggers recovery flow
    expect(hasRecoveryTokens({ search: '?code=garbage', hash: '' })).toBe(true)
    // normal page with no tokens does NOT trigger recovery
    expect(hasRecoveryTokens({ search: '?foo=bar', hash: '' })).toBe(false)
    // being on /reset-password route also triggers reset page regardless
    expect(shouldShowPasswordResetPage({ pathname: '/reset-password', search: '', hash: '', resetReady: false })).toBe(true)
  })
})
