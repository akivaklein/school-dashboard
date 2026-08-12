import { useEffect, useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import AppErrorBoundary from './components/AppErrorBoundary'
import SetNewPasswordPage from './components/SetNewPasswordPage'
import { supabase } from './supabaseClient'
import type { AuthMode } from './utils/authRecovery'
import {
  buildPasswordResetRedirectUrl,
  getPasswordResetErrorMessage,
  getRecoveryModeFromUrl,
  hasRecoveryTokens,
  shouldShowPasswordResetPage,
} from './utils/authRecovery'
import { ROLE_LOOKUP_FAILED_MESSAGE, resolveDashboardAccess } from './utils/dashboardAccess'
import type { UserRoleRecord } from './utils/dashboardAccess'

type DashboardUser = {
  role: string
  name: string
}

const RESET_EMAIL_COOLDOWN_SECONDS = 90

function readAppUrl() {
  const configured = String(import.meta.env.VITE_APP_URL || '').trim()
  if (!configured) return window.location.origin
  return configured.replace(/\/$/, '')
}

function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>(() => getRecoveryModeFromUrl({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash }))
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(null)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authActionBusy, setAuthActionBusy] = useState(false)
  const [resetCooldownUntil, setResetCooldownUntil] = useState<number>(0)
  const [resetNow, setResetNow] = useState<number>(Date.now())
  const [isResetReady, setIsResetReady] = useState(false)
  const [resetLinkError, setResetLinkError] = useState('')
  const appUrl = readAppUrl()
  const isResetRoute = window.location.pathname === '/reset-password'
  const shouldShowResetPage = shouldShowPasswordResetPage({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash, resetReady: isResetReady, isAuthenticated: Boolean(sessionUserId) })
  const resetCooldownSeconds = Math.max(0, Math.ceil((resetCooldownUntil - resetNow) / 1000))
  const resetCooldownActive = resetCooldownSeconds > 0

  useEffect(() => {
    const timer = window.setInterval(() => {
      setResetNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      try {
      // Handle recovery links that use code-based exchange.
      const searchParams = new URLSearchParams(window.location.search)
      const resetCode = searchParams.get('code')
      if (resetCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(resetCode)
        if (error && active) {
          setResetLinkError(getPasswordResetErrorMessage(error.message))
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (!active) return

      if (error) {
        setAuthError(error.message)
        setIsAuthLoading(false)
        return
      }

      if (isResetRoute || hasRecoveryTokens({ search: window.location.search, hash: window.location.hash })) {
        if (data.session?.user?.id) {
          setIsResetReady(true)
          setResetLinkError('')
          window.history.replaceState({}, document.title, '/reset-password')
        } else if (isResetRoute) {
          setIsResetReady(false)
          setResetLinkError('This password reset link is invalid, expired, or already used. Request a new reset email.')
          window.history.replaceState({}, document.title, '/reset-password')
        }
      }

      const nextUserId = data.session?.user?.id || null
      setSessionUserId(nextUserId)
      setIsAuthLoading(false)
      } catch (err) {
        if (!active) return
        setResetLinkError('An unexpected error occurred during session check. Please refresh or request a new reset link.')
        setIsAuthLoading(false)
      }
    }

    initializeAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id || null
      setSessionUserId(nextUserId)

      if (event === 'PASSWORD_RECOVERY') {
        setDashboardUser(null)
        setIsResetReady(true)
        setResetLinkError('')
        setAuthMessage('Set a new password to finish account recovery.')
        setAuthMode('forgot-password')
        window.history.replaceState({}, document.title, '/reset-password')
      }

      if (event === 'SIGNED_OUT') {
        setDashboardUser(null)
        setAuthMode('sign-in')
        setSessionUserId(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadUserRole() {
      if (!sessionUserId) {
        setDashboardUser(null)
        return
      }

      setAuthError('')
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, display_name, is_active')
        .eq('user_id', sessionUserId)
        .order('role')
        .returns<UserRoleRecord[]>()

      if (!active) return

      if (error) {
        console.error('Failed to load dashboard role:', error.message)
        setDashboardUser(null)
        setAuthError(ROLE_LOOKUP_FAILED_MESSAGE)
        return
      }

      const access = resolveDashboardAccess(data)

      if (access.status === 'denied') {
        setDashboardUser(null)
        setAuthError(access.message)
        return
      }

      setDashboardUser(access.user)
    }

    loadUserRole()

    return () => {
      active = false
    }
  }, [sessionUserId])

  const appShellStyle = useMemo(() => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(130deg, #f3f6fb 0%, #eef2f8 45%, #f7fafc 100%)',
    padding: 20,
    fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
  }), [])

  async function handleSignIn() {
    setAuthActionBusy(true)
    setAuthError('')
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthError(error.message)
    }

    setAuthActionBusy(false)
  }

  async function handleSendResetEmail() {
    if (authActionBusy || resetCooldownActive) {
      return
    }

    setAuthActionBusy(true)
    setAuthError('')
    setAuthMessage('')

    const redirectTo = buildPasswordResetRedirectUrl({
      configuredAppUrl: appUrl,
      currentOrigin: window.location.origin,
      fallbackOrigin: 'https://yeshiva-ketana-secure.vercel.app',
      isProduction: import.meta.env.PROD,
    })
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

    if (error) {
      const lowerMessage = String(error.message || '').toLowerCase()
      if (lowerMessage.includes('rate') || lowerMessage.includes('too many') || lowerMessage.includes('over_email_send_rate_limit')) {
        setAuthError('Too many reset requests were sent recently. Please wait before trying again.')
      } else {
        setAuthError(error.message)
      }
    } else {
      setResetCooldownUntil(Date.now() + RESET_EMAIL_COOLDOWN_SECONDS * 1000)
      setAuthMessage('Password reset email sent. Open the link to set a new password.')
      setAuthMode('sign-in')
    }

    setAuthActionBusy(false)
  }

  async function handleSecureLogout() {
    await supabase.auth.signOut()
    setDashboardUser(null)
    setSessionUserId(null)
    setAuthMode('sign-in')
  }

  if (isAuthLoading) {
    return (
      <div style={appShellStyle}>
        <div style={{ background: '#fff', border: '1px solid #d8e1ec', borderRadius: 14, padding: '20px 24px', fontWeight: 700, color: '#334155' }}>
          Checking secure session...
        </div>
      </div>
    )
  }

  if (shouldShowResetPage) {
    return (
      <SetNewPasswordPage
        ready={isResetReady}
        errorMessage={resetLinkError}
        onBackToSignIn={() => {
          setAuthMode('sign-in')
          setAuthError('')
          setAuthMessage('')
          setResetLinkError('')
          setIsResetReady(false)
          window.history.replaceState({}, document.title, '/')
        }}
      />
    )
  }

  if (dashboardUser) {
    return (
      <AppErrorBoundary onLogout={handleSecureLogout}>
        <Dashboard
          teacherUser={dashboardUser}
          onTeacherSessionLogout={handleSecureLogout}
        />
      </AppErrorBoundary>
    )
  }

  return (
    <div style={appShellStyle}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #d8e1ec', borderRadius: 18, boxShadow: '0 18px 38px rgba(15,23,42,0.09)', padding: 26 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#172033', marginBottom: 6 }}>Yeshiva Ketana Secure Login</div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Sign in with your Supabase Auth email and password.</div>

        {(authError || authMessage) && (
          <div
            style={{
              borderRadius: 10,
              border: authError ? '1px solid #fecaca' : '1px solid #bbf7d0',
              background: authError ? '#fef2f2' : '#f0fdf4',
              color: authError ? '#991b1b' : '#166534',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 12px',
              marginBottom: 12,
            }}
          >
            {authError || authMessage}
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="admin@yeshivaketana.org"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d8e1ec', borderRadius: 10, fontSize: 14 }}
          />
        </div>

        {authMode === 'sign-in' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter password"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d8e1ec', borderRadius: 10, fontSize: 14 }}
              />
            </div>

            <button
              onClick={handleSignIn}
              disabled={authActionBusy}
              style={{ width: '100%', border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '11px 12px', cursor: authActionBusy ? 'not-allowed' : 'pointer' }}
            >
              {authActionBusy ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              onClick={() => {
                setAuthMode('forgot-password')
                setAuthError('')
                setAuthMessage('')
              }}
              style={{ marginTop: 10, border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </>
        )}

        {authMode === 'forgot-password' && (
          <>
            <button
              onClick={handleSendResetEmail}
              disabled={authActionBusy || resetCooldownActive}
              style={{ width: '100%', border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '11px 12px', cursor: (authActionBusy || resetCooldownActive) ? 'not-allowed' : 'pointer', opacity: resetCooldownActive ? 0.65 : 1 }}
            >
              {authActionBusy ? 'Sending...' : resetCooldownActive ? `Try Again In ${resetCooldownSeconds}s` : 'Send Reset Email'}
            </button>

            {resetCooldownActive && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                For security, reset requests are temporarily throttled after each send.
              </div>
            )}

            <button
              onClick={() => {
                setAuthMode('sign-in')
                setAuthError('')
                setAuthMessage('')
              }}
              style={{ marginTop: 10, border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </>
        )}

        <div style={{ marginTop: 14, fontSize: 11, color: '#64748b' }}>
          Public signup is disabled in this secure deployment.
        </div>

        {sessionUserId && (
          <button
            onClick={handleSecureLogout}
            style={{ marginTop: 12, width: '100%', border: '1px solid #d8e1ec', borderRadius: 10, background: '#fff', color: '#1e3a5f', fontWeight: 800, padding: '10px 12px', cursor: 'pointer' }}
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  )
}

export default App