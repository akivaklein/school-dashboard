import { useState } from 'react'
import { createRegisterAccount } from '../services/registerAccountsService'

export default function RegisterAccountsSection({ S }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setStatus(null)
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      setStatus({ tone: 'error', text: 'Enter a register name, email, and password with at least 8 characters.' })
      return
    }

    setSaving(true)
    try {
      await createRegisterAccount({ displayName: displayName.trim(), email: email.trim(), password })
      setStatus({ tone: 'success', text: `${displayName.trim()} can now sign in to the Token Store.` })
      setDisplayName('')
      setEmail('')
      setPassword('')
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to create register account.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ ...S.card, maxWidth: 720 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#223046' }}>Canteen Register Accounts</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 18 }}>
        Create a named cashier account. The cashier will have access only to student lookup and Token Store checkout.
      </div>
      {status && <div style={{ marginBottom: 12, padding: '9px 11px', borderRadius: 8, background: status.tone === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.tone === 'success' ? '#86efac' : '#fecaca'}`, color: status.tone === 'success' ? '#166534' : '#991b1b', fontSize: 12, fontWeight: 700 }}>{status.text}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Register name</span>
          <input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Canteen Register 1" autoComplete="name" style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Login email</span>
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="register1@example.com" autoComplete="username" style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Temporary password</span>
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 13 }} />
        </label>
        <button type="submit" disabled={saving} style={{ ...S.btn('primary'), justifySelf: 'start', padding: '9px 14px' }}>{saving ? 'Creating...' : 'Create Register Account'}</button>
      </form>
      <div style={{ marginTop: 16, fontSize: 11, lineHeight: 1.5, color: '#64748b' }}>Give the cashier the temporary password privately. They can use Forgot Password on the sign-in screen to choose their own password later.</div>
    </div>
  )
}
