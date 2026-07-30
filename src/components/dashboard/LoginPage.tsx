import { useMemo, useState } from 'react'
import { createLoginAccounts, getLastName, getMatchingLoginAccounts, type DemoLoginAccount } from './loginUserSearch'

type LoginPageProps = {
  onLogin: (role: string, name: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [role, setRole] = useState('admin')
  const [userInput, setUserInput] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<DemoLoginAccount | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const accounts = useMemo(() => createLoginAccounts([
    { role: 'admin', name: 'Rabbi Baum' },
    { role: 'admin', name: 'Eli Bloom' },
    { role: 'admin', name: 'Zev Reisman' },
    { role: 'admin', name: 'Eli Stern' },
    { role: 'therapist', name: 'Shelly Wagschal' },
    { role: 'therapist', name: 'Aryeh Schechter' },
    { role: 'therapist', name: 'Tzvi Malks' },
    { role: 'admin', name: 'Rabbi Ehrnreich' },
    { role: 'admin', name: 'Rabbi Weiss' },
    { role: 'admin', name: 'Rabbi Hillel' },
    { role: 'admin', name: 'Rabbi Fried' },
    { role: 'admin', name: 'Rabbi Blau' },
    { role: 'admin', name: 'Rabbi Abramowitz' },
    { role: 'store', name: 'Canteen Register' },
    { role: 'teacher', name: 'Rabbi Klein' },
    { role: 'teacher', name: 'Rabbi Schults' },
    { role: 'teacher', name: 'Rabbi Schimborski' },
    { role: 'teacher', name: 'Rabbi Goldstein' },
    { role: 'admin', name: 'Rabbi Lefkowitz' },
    { role: 'teacher', name: 'Rabbi Ambush' },
    { role: 'teacher', name: 'Rabbi Abowitz' },
    { role: 'therapist', name: 'Yitzi Liebowitz' },
    { role: 'therapist', name: 'Mrs. Goldberg' },
  ]), [])
  const filtered = useMemo(() => getMatchingLoginAccounts(accounts, userInput, role), [accounts, role, userInput])
  const normalizedUserInput = userInput.trim().toLowerCase()
  const duplicateLastNameMatches = useMemo(() => {
    if (!normalizedUserInput || filtered.length < 2) return []
    return filtered.filter(account => getLastName(account.name).trim().toLowerCase() === normalizedUserInput)
  }, [filtered, normalizedUserInput])

  function selectAccount(acc: DemoLoginAccount) {
    setSelectedAccount(acc)
    setUserInput(acc.name)
    setRole(acc.role)
    setShowSuggestion(false)
    setErrorMessage('')
  }

  function changeRole(nextRole: string) {
    setRole(nextRole)
    setSelectedAccount(null)
    setUserInput('')
    setShowSuggestion(false)
    setErrorMessage('')
  }

  function handleLogin() {
    if (!selectedAccount) {
      setErrorMessage('Please select one exact user from the list before signing in.')
      return
    }

    const exactMatch = accounts.find(account => account.id === selectedAccount.id)
    if (!exactMatch) {
      setErrorMessage('Please select one exact user from the list before signing in.')
      return
    }

    onLogin(exactMatch.role, exactMatch.name)
  }

  const loginInputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #d8dee9', fontSize: 14, boxSizing: 'border-box' as const, background: '#fbfdff', color: '#172033', outline: 'none' }
  const loginLabelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eef2f7 0%, #f8fafc 44%, #e8edf4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", padding: 24 }}>
      <div style={{ width: 930, minHeight: 560, display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', background: '#ffffff', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.28)', boxShadow: '0 28px 80px rgba(15,23,42,0.16)' }}>
        <div style={{ position: 'relative', padding: '54px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(160deg, #101827 0%, #182338 58%, #22304a 100%)', color: '#fff' }}>
          <div style={{ position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', left: -60, bottom: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(191,219,254,0.08)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ width: 58, height: 58, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 24 }}>HA</div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1.04, marginBottom: 12 }}>Hadran Academy</div>
            <div style={{ color: 'rgba(226,232,240,0.76)', fontSize: 15, lineHeight: 1.55, maxWidth: 340 }}>A clear command center for attendance, student support, academics, and daily staff coordination.</div>
          </div>

          <div style={{ position: 'relative', display: 'grid', gap: 12 }}>
            {['Menahel Dashboard', 'Teacher Portal', 'Student Support', 'Canteen & Rewards'].map((label) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(241,245,249,0.82)', fontSize: 13.5, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#93c5fd', boxShadow: '0 0 0 4px rgba(147,197,253,0.12)' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '58px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#ffffff' }}>
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.04em', marginBottom: 6 }}>Welcome back</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>Choose your role and sign in to continue.</div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={loginLabelStyle}>Sign in as</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {[['admin','Admin'],['teacher','Teacher'],['therapist','Therapist'],['store','Canteen']].map(([r, label]) => (
                <button key={r} onClick={() => changeRole(r)} style={{ padding: '11px 8px', borderRadius: 12, border: `1px solid ${role === r ? '#172033' : '#d8dee9'}`, background: role === r ? '#172033' : '#f8fafc', color: role === r ? '#fff' : '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: role === r ? '0 8px 18px rgba(15,23,42,0.16)' : 'none' }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16, position: 'relative' }}>
            <div style={loginLabelStyle}>User</div>
            <input
              value={userInput}
              onChange={e => {
                setUserInput(e.target.value)
                setSelectedAccount(null)
                setErrorMessage('')
                setShowSuggestion(true)
              }}
              onFocus={() => setShowSuggestion(true)}
              placeholder="Start typing your last name"
              style={loginInputStyle}
            />
            {showSuggestion && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', border: '1px solid #d8dee9', borderRadius: 14, boxShadow: '0 18px 36px rgba(15,23,42,0.14)', zIndex: 10, overflow: 'hidden' }}>
                {filtered.map((acc) => (
                  <div key={acc.id} onClick={() => selectAccount(acc)} style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ fontWeight: 700, color: '#172033' }}>{acc.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{acc.roleLabel}</div>
                  </div>
                ))}
              </div>
            )}
            {showSuggestion && filtered.length === 0 && userInput.trim().length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#9f1239' }}>No exact match found. Type a last name and choose one result.</div>
            )}
            {duplicateLastNameMatches.length > 1 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>Multiple users share this last name. Choose one exact result from the list.</div>
            )}
            {errorMessage && <div style={{ marginTop: 8, fontSize: 12, color: '#9f1239' }}>{errorMessage}</div>}
          </div>

          <button onClick={handleLogin} disabled={!selectedAccount} style={{ width: '100%', padding: '14px', borderRadius: 13, border: 'none', background: selectedAccount ? '#172033' : '#cbd5e1', color: '#fff', fontSize: 15, fontWeight: 700, cursor: selectedAccount ? 'pointer' : 'not-allowed', boxShadow: selectedAccount ? '0 14px 26px rgba(15,23,42,0.18)' : 'none' }}>Sign In</button>
          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 22 }}>Select a demo user from the list above to continue.</div>
        </div>
      </div>
    </div>
  )
}
