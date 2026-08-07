import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

type SetNewPasswordPageProps = {
  ready: boolean
  errorMessage: string
  onBackToSignIn: () => void
}

export default function SetNewPasswordPage({ ready, errorMessage, onBackToSignIn }: SetNewPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusError, setStatusError] = useState(errorMessage)
  const [statusMessage, setStatusMessage] = useState('')

  const shellStyle = useMemo(() => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(130deg, #f3f6fb 0%, #eef2f8 45%, #f7fafc 100%)',
    padding: 20,
    fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
  }), [])

  async function handleUpdatePassword() {
    setStatusError('')
    setStatusMessage('')

    if (!ready) {
      setStatusError('This password reset link is invalid, expired, or already used. Request a new reset email.')
      return
    }

    if (newPassword.trim().length < 8) {
      setStatusError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() })

    if (error) {
      const message = String(error.message || 'Unable to set new password.')
      if (/expired|invalid|jwt|token|session/i.test(message)) {
        setStatusError('This password reset link is invalid, expired, or already used. Request a new reset email.')
      } else {
        setStatusError(message)
      }
      setBusy(false)
      return
    }

    // Clear any recovery hash/query fragments from the URL after successful processing.
    window.history.replaceState({}, document.title, '/reset-password')

    setStatusMessage('Password updated. Sign in with your new password.')
    setNewPassword('')
    setConfirmPassword('')
    setBusy(false)

    await supabase.auth.signOut()
  }

  return (
    <div style={shellStyle}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #d8e1ec', borderRadius: 18, boxShadow: '0 18px 38px rgba(15,23,42,0.09)', padding: 26 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#172033', marginBottom: 6 }}>Set New Password</div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Use a secure password with at least 8 characters.</div>

        {(statusError || statusMessage) && (
          <div
            style={{
              borderRadius: 10,
              border: statusError ? '1px solid #fecaca' : '1px solid #bbf7d0',
              background: statusError ? '#fef2f2' : '#f0fdf4',
              color: statusError ? '#991b1b' : '#166534',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 12px',
              marginBottom: 12,
            }}
          >
            {statusError || statusMessage}
          </div>
        )}

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

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Confirm Password</div>
          <input
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            placeholder="Re-enter password"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d8e1ec', borderRadius: 10, fontSize: 14 }}
          />
        </div>

        <button
          onClick={handleUpdatePassword}
          disabled={busy}
          style={{ width: '100%', border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '11px 12px', cursor: busy ? 'not-allowed' : 'pointer' }}
        >
          {busy ? 'Updating...' : 'Update Password'}
        </button>

        <button
          onClick={onBackToSignIn}
          style={{ marginTop: 10, border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  )
}
