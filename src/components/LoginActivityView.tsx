import React, { useState, useEffect } from 'react'
import { getLoginHistory, getLoginStats } from '../services/loginSessionService'

interface LoginSession {
  id: number
  staff_id: number
  staff_name: string
  role: string
  login_time: string
  logout_time?: string
  session_duration_seconds?: number
}

interface LoginStats {
  [key: string]: {
    name: string
    role: string
    loginCount: number
    totalSessionSeconds: number
    avgSessionSeconds: number
    activeSessions?: number
  }
}

interface LoginActivityViewProps {
  onClose: () => void
}

export default function LoginActivityView({ onClose }: LoginActivityViewProps) {
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [stats, setStats] = useState<LoginStats>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'stats'>('sessions')
  const [daysFilter, setDaysFilter] = useState(7)

  useEffect(() => {
    loadData()
  }, [daysFilter])

  async function loadData() {
    setLoading(true)
    const [sessionsData, statsData] = await Promise.all([
      getLoginHistory(undefined, daysFilter),
      getLoginStats(daysFilter),
    ])
    setSessions(sessionsData)
    setStats(statsData)
    setLoading(false)
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString()
  }

  function formatDuration(seconds?: number) {
    if (!seconds) return '—'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.42)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 1000,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 70px rgba(15,23,42,0.22)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#0f172a',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>📊 Login Activity</div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: 28,
              height: 28,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs and filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${activeTab === 'sessions' ? '#172033' : '#d8dee9'}`,
                background: activeTab === 'sessions' ? '#172033' : '#fff',
                color: activeTab === 'sessions' ? '#fff' : '#334155',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${activeTab === 'stats' ? '#172033' : '#d8dee9'}`,
                background: activeTab === 'stats' ? '#172033' : '#fff',
                color: activeTab === 'stats' ? '#fff' : '#334155',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Statistics
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Last</span>
            <select
              value={daysFilter}
              onChange={e => setDaysFilter(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #d8dee9',
                fontSize: 12,
                outline: 'none',
              }}
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              Loading...
            </div>
          ) : activeTab === 'sessions' ? (
            <div>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  No login sessions in this period
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>
                          Staff Name
                        </th>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>Role</th>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>
                          Login Time
                        </th>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>
                          Logout Time
                        </th>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>
                          Duration
                        </th>
                        <th style={{ padding: 10, textAlign: 'left', fontWeight: 700 }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(session => (
                        <tr
                          key={session.id}
                          style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}
                        >
                          <td style={{ padding: 10, fontWeight: 600 }}>{session.staff_name}</td>
                          <td style={{ padding: 10, color: '#64748b' }}>{session.role}</td>
                          <td style={{ padding: 10, color: '#64748b' }}>
                            {formatTime(session.login_time)}
                          </td>
                          <td style={{ padding: 10, color: '#64748b' }}>
                            {session.logout_time ? formatTime(session.logout_time) : '—'}
                          </td>
                          <td style={{ padding: 10, color: '#64748b' }}>
                            {formatDuration(session.session_duration_seconds)}
                          </td>
                          <td style={{ padding: 10 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                background: session.logout_time ? '#f1f5f9' : '#dcfce7',
                                color: session.logout_time ? '#64748b' : '#166534',
                              }}
                            >
                              {session.logout_time ? 'Logged out' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              {Object.keys(stats).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  No login statistics available
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {Object.values(stats).map((stat: any) => (
                    <div
                      key={stat.name}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 16,
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                        {stat.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                        {stat.role}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                        }}
                      >
                        <div style={{ background: '#fff', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Logins</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#334155' }}>
                            {stat.loginCount}
                          </div>
                        </div>
                        <div style={{ background: '#fff', padding: 8, borderRadius: 6 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg Session</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            {formatDuration(stat.avgSessionSeconds)}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                        Total time: <strong>{formatDuration(stat.totalSessionSeconds)}</strong>
                      </div>

                      {(stat.activeSessions || 0) > 0 && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#166534', fontWeight: 700 }}>
                          Active now: {stat.activeSessions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#172033',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
