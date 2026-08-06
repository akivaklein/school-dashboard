import { useEffect, useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import { supabase } from './supabaseClient'

type DashboardUser = {
  role: string
  name: string
}

type AuthMode = 'sign-in' | 'forgot-password' | 'reset-password'

type UserRoleRecord = {
  role: string
  display_name: string | null
  is_active: boolean | null
}

function getRecoveryModeFromUrl(): AuthMode {
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  const raw = `${hash}&${search}`.toLowerCase()
  return raw.includes('type=recovery') ? 'reset-password' : 'sign-in'
}

function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>(() => getRecoveryModeFromUrl())
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(null)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authActionBusy, setAuthActionBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return

      if (error) {
        setAuthError(error.message)
        setIsAuthLoading(false)
        return
      }

      const nextUserId = data.session?.user?.id || null
      setSessionUserId(nextUserId)
      setIsAuthLoading(false)
    }

    initializeAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id || null
      setSessionUserId(nextUserId)

      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset-password')
        setAuthMessage('Set a new password to finish account recovery.')
      }

      if (event === 'SIGNED_OUT') {
        setDashboardUser(null)
        setAuthMode('sign-in')
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
        .single<UserRoleRecord>()

      if (!active) return

      if (error) {
        setDashboardUser(null)
        setAuthError('Authenticated, but no active dashboard role is configured for this account.')
        return
      }

      if (data.is_active === false || data.role !== 'admin') {
        setDashboardUser(null)
        setAuthError('This account is not authorized for admin dashboard access.')
        return
      }

      const fallbackName = 'Yeshiva Ketana Admin'
      setDashboardUser({
        role: 'admin',
        name: (data.display_name || '').trim() || fallbackName,
      })
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
    setAuthActionBusy(true)
    setAuthError('')
    setAuthMessage('')

    const redirectTo = `${window.location.origin}/`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password reset email sent. Open the link to set a new password.')
      setAuthMode('sign-in')
    }

    setAuthActionBusy(false)
  }

  async function handleResetPassword() {
    if (newPassword.trim().length < 8) {
      setAuthError('Password must be at least 8 characters.')
      return
    }

    setAuthActionBusy(true)
    setAuthError('')
    setAuthMessage('')

    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password updated. You can now sign in.')
      setAuthMode('sign-in')
      setNewPassword('')
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

  if (dashboardUser) {
    return (
      <Dashboard
        teacherUser={dashboardUser}
        onTeacherSessionLogout={handleSecureLogout}
      />
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

        {authMode !== 'reset-password' && (
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
        )}

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
              disabled={authActionBusy}
              style={{ width: '100%', border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '11px 12px', cursor: authActionBusy ? 'not-allowed' : 'pointer' }}
            >
              {authActionBusy ? 'Sending...' : 'Send Reset Email'}
            </button>

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

        {authMode === 'reset-password' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>New Password</div>
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d8e1ec', borderRadius: 10, fontSize: 14 }}
              />
            </div>
            <button
              onClick={handleResetPassword}
              disabled={authActionBusy}
              style={{ width: '100%', border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '11px 12px', cursor: authActionBusy ? 'not-allowed' : 'pointer' }}
            >
              {authActionBusy ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}

        <div style={{ marginTop: 14, fontSize: 11, color: '#64748b' }}>
          Public signup is disabled in this secure deployment.
        </div>
      </div>
    </div>
  )
}

export default App