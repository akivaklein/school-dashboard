import React, { useState } from 'react'

interface TeacherOnlyLoginProps {
  onLogin: (role: string, name: string) => void
}

const ADMIN_NAMES = [
  'Rabbi Baum',
  'Eli Bloom',
  'Zev Reisman',
  'Eli Stern',
  'Rabbi Ehrnreich',
  'Rabbi Weiss',
  'Rabbi Hillel',
  'Rabbi Fried',
  'Rabbi Blau',
  'Rabbi Abramowitz',
  'Rabbi Lefkowitz',
]

const TEACHER_ACCOUNTS = [
  { role: 'teacher', name: 'Rabbi Klein', email: 'rklein@hadranacademy.org' },
  { role: 'teacher', name: 'Rabbi Schults', email: 'rschults@hadranacademy.org' },
  { role: 'teacher', name: 'Rabbi Schimborski', email: 'rschimborski@hadranacademy.org' },
  { role: 'teacher', name: 'Rabbi Goldstein', email: 'rgoldstein@hadranacademy.org' },
  { role: 'teacher', name: 'Rabbi Ambush', email: 'rambush@hadranacademy.org' },
  { role: 'teacher', name: 'Rabbi Abowitz', email: 'rabowitz@hadranacademy.org' },
]

export default function TeacherOnlyLoginPage({ onLogin }: TeacherOnlyLoginProps) {
  const [emailInput, setEmailInput] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [error, setError] = useState('')

  const filtered = emailInput.length > 1
    ? TEACHER_ACCOUNTS.filter(
        a =>
          a.email.toLowerCase().includes(emailInput.toLowerCase()) ||
          a.name.toLowerCase().includes(emailInput.toLowerCase())
      )
    : []

  function selectAccount(acc) {
    // Check if this is an admin name trying to log in
    if (ADMIN_NAMES.includes(acc.name)) {
      setError('❌ Admin accounts cannot log in via teacher portal. Please use the main login.')
      setEmailInput('')
      return
    }

    setError('')
    setEmailInput(acc.email)
    setShowSuggestion(false)
  }

  function handleLogin() {
    // Extra validation: block admin accounts
    if (ADMIN_NAMES.some(name => name.toLowerCase() === emailInput.toLowerCase())) {
      setError('❌ Admin accounts are not permitted in teacher-only mode.')
      return
    }

    const acc = TEACHER_ACCOUNTS.find(a => a.email === emailInput)
    if (acc) {
      setError('')
      onLogin(acc.role, acc.name)
    } else {
      setError('⚠️ Please select a valid teacher account from the list.')
    }
  }

  const loginInputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${error ? '#dc2626' : '#d8dee9'}`,
    fontSize: 14,
    boxSizing: 'border-box' as const,
    background: '#fbfdff',
    color: '#172033',
    outline: 'none',
  }

  const loginLabelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 7,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 44%, #eff6ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 930,
          minHeight: 560,
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          background: '#ffffff',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.28)',
          boxShadow: '0 28px 80px rgba(15,23,42,0.16)',
        }}
      >
        {/* Left side - info */}
        <div
          style={{
            position: 'relative',
            padding: '54px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(160deg, #064e3b 0%, #065f46 58%, #10b981 100%)',
            color: '#fff',
          }}
        >
          <div style={{ position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div
            style={{
              position: 'absolute',
              left: -60,
              bottom: -80,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'rgba(191,219,254,0.08)',
            }}
          />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                marginBottom: 24,
              }}
            >
              👨‍🏫
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '-0.05em',
                lineHeight: 1.04,
                marginBottom: 12,
              }}
            >
              Teacher Portal
            </div>
            <div style={{ color: 'rgba(226,232,240,0.76)', fontSize: 15, lineHeight: 1.55, maxWidth: 340 }}>
              Secure access for teachers and staff. Only teacher accounts are permitted in this portal.
            </div>
          </div>

          <div style={{ position: 'relative', display: 'grid', gap: 12 }}>
            {['Teacher Grade Entry', 'Class Management', 'Student Grades', 'Parent Communication'].map(label => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: 'rgba(241,245,249,0.82)',
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#86efac',
                    boxShadow: '0 0 0 4px rgba(134,239,172,0.12)',
                  }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - login form */}
        <div
          style={{
            padding: '58px 52px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.04em', marginBottom: 6 }}>
              Teacher Login
            </div>
            <div style={{ color: '#64748b', fontSize: 14 }}>
              Enter your name or email to continue.
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16, position: 'relative' }}>
            <div style={loginLabelStyle}>Your Name or Email</div>
            <input
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value)
                setShowSuggestion(true)
                setError('')
              }}
              onFocus={() => setShowSuggestion(true)}
              placeholder="Select your teacher account"
              style={loginInputStyle}
            />
            {showSuggestion && filtered.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d8dee9',
                  borderRadius: 14,
                  boxShadow: '0 18px 36px rgba(15,23,42,0.14)',
                  zIndex: 10,
                  overflow: 'hidden',
                }}
              >
                {filtered.map((acc, i) => (
                  <div
                    key={i}
                    onClick={() => selectAccount(acc)}
                    style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ fontWeight: 700, color: '#172033' }}>{acc.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{acc.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 13,
              border: 'none',
              background: '#047857',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 14px 26px rgba(4,120,87,0.18)',
            }}
          >
            Sign In
          </button>

          <div
            style={{
              color: '#94a3b8',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 22,
            }}
          >
            ⚠️ Admin accounts are blocked from this portal.{' '}
            <a
              href="/"
              style={{
                color: '#047857',
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Main login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
