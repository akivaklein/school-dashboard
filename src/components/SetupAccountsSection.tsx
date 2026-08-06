import { useMemo, useState } from 'react'
import { buildStaffAccountData, getStaffAccountStatus } from '../services/staffService'

const EMAIL_INVITES_ENABLED = false
const INVITES_DISABLED_MESSAGE = 'Email invites are disabled in this environment. Connect Supabase Auth invite flow to enable invitations.'
const INVITE_STATE_HELP = 'Invites are currently unavailable in this demo environment. Existing staff accounts remain unchanged until invite flow is configured.'

const STATUS_CONFIG = {
  'active-account':      { label: 'Active',   dot: '#16a34a', text: '#14532d', bg: '#f0fdf4' },
  'pending-invitation':  { label: 'Pending',  dot: '#d97706', text: '#78350f', bg: '#fffbeb' },
  'inactive-account':    { label: 'Inactive', dot: '#64748b', text: '#334155', bg: '#f1f5f9' },
  'missing':             { label: 'No account', dot: '#cbd5e1', text: '#64748b', bg: '#f8fafc' },
}

export default function SetupAccountsSection({
  SETUP_PEOPLE,
  setupAccounts,
  setSetupAccounts,
  S,
  DIVISIONS,
  actorName,
  actorRole,
  onPreviewAs,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({})
  const [inviteBanner, setInviteBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const people = Array.isArray(SETUP_PEOPLE) ? SETUP_PEOPLE : []
  const totalUsers = people.length
  const normalizeStatus = (status: string) => {
    if (!EMAIL_INVITES_ENABLED && status === 'pending-invitation') return 'inactive-account'
    return status
  }

  const activeCount = people.filter(person => normalizeStatus(getStaffAccountStatus(setupAccounts[person.name])) === 'active-account').length
  const pendingCount = EMAIL_INVITES_ENABLED
    ? people.filter(person => normalizeStatus(getStaffAccountStatus(setupAccounts[person.name])) === 'pending-invitation').length
    : 0
  const disabledCount = people.filter(person => {
    const s = normalizeStatus(getStaffAccountStatus(setupAccounts[person.name]))
    return s === 'inactive-account' || s === 'missing'
  }).length

  const filteredPeople = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return people.filter(person => {
      const account = setupAccounts[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })
      const state = normalizeStatus(getStaffAccountStatus(account))
      const active = state === 'active-account'
      const divisions = account.divisions || 'both'

      const matchesSearch = !normalized
        || String(person.name || '').toLowerCase().includes(normalized)
        || String(person.specialty || '').toLowerCase().includes(normalized)
        || String(person.role || '').toLowerCase().includes(normalized)

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && active)
        || (statusFilter === 'pending' && state === 'pending-invitation')
        || (statusFilter === 'disabled' && !active && state !== 'pending-invitation')

      const matchesDivision = divisionFilter === 'all'
        || divisions === 'both'
        || divisions === divisionFilter

      return matchesSearch && matchesStatus && matchesDivision
    })
  }, [people, setupAccounts, search, statusFilter, divisionFilter])

  function withAttribution(baseAccount, overrides = {}) {
    return {
      ...baseAccount,
      ...overrides,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName || 'System',
      updatedByRole: actorRole || 'admin',
    }
  }

  function sendInvite(person) {
    if (!EMAIL_INVITES_ENABLED) {
      setInviteBanner({
        tone: 'error',
        text: INVITES_DISABLED_MESSAGE,
      })
      return
    }

    const email = (inviteEmail[person.name] || '').trim()
    if (!email) {
      setInviteBanner({ tone: 'error', text: 'Enter an email address before sending an invite.' })
      return
    }

    setSetupAccounts(previous => ({
      ...previous,
      [person.name]: {
        ...(previous[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })),
        ...withAttribution(previous[person.name] || {}, {
          active: true,
          accountState: 'pending',
          email: email || undefined,
          invitedAt: new Date().toISOString(),
          invitedBy: actorName || 'System',
          invitedByRole: actorRole || 'admin',
        }),
      }
    }))
    setInviteBanner({ tone: 'success', text: `Invite queued for ${person.name}.` })
  }

  function formatDate(iso?: string) {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return '—' }
  }

  const isLeadership = (role?: string) => /admin|menahel|mashgiach|principal/i.test(role || '')

  return (
                    <div style={S.card}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#102a43', marginBottom: 4 }}>
                        Users &amp; Access
                      </div>
                      <div style={{ fontSize: 12, color: '#52667e', marginBottom: 14 }}>
                        Manage account status, invitations, division scope, and access controls.
                      </div>

                      {!EMAIL_INVITES_ENABLED && (
                        <div style={{ marginBottom: 12, borderRadius: 8, padding: '8px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 700 }}>
                          <div>{INVITES_DISABLED_MESSAGE}</div>
                          <div style={{ marginTop: 4, fontWeight: 600, color: '#334155' }}>{INVITE_STATE_HELP}</div>
                        </div>
                      )}

                        {inviteBanner && (
                          <div style={{ marginBottom: 12, borderRadius: 8, padding: '8px 10px', border: inviteBanner.tone === 'success' ? '1px solid #86efac' : '1px solid #fecaca', background: inviteBanner.tone === 'success' ? '#f0fdf4' : '#fef2f2', color: inviteBanner.tone === 'success' ? '#166534' : '#991b1b', fontSize: 12, fontWeight: 700 }}>
                            {inviteBanner.text}
                          </div>
                        )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) repeat(3, minmax(120px, 160px))', gap: 8, marginBottom: 12 }}>
                        <input
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          placeholder="Search by name, role, or specialty"
                          spellCheck={false}
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}
                        />
                        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}>
                          <option value="all">All status</option>
                          <option value="active">Active</option>
                          <option value="pending" disabled={!EMAIL_INVITES_ENABLED}>{EMAIL_INVITES_ENABLED ? 'Pending invite' : 'Pending invite (disabled)'}</option>
                          <option value="disabled">Inactive / No account</option>
                        </select>
                        <select value={divisionFilter} onChange={event => setDivisionFilter(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}>
                          <option value="all">All divisions</option>
                          <option value="yeshiva-ketana">Yeshiva Ketana</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
                        {[
                          { label: 'Total Staff', value: totalUsers, accent: '#5b7ea5' },
                          { label: 'Active', value: activeCount, accent: '#16a34a' },
                          { label: 'Pending', value: pendingCount, accent: '#d97706' },
                          { label: 'Inactive', value: disabledCount, accent: '#64748b' },
                        ].map(summary => (
                          <div key={summary.label} style={{ border: '1px solid #dbe5f0', borderRadius: 8, background: '#ffffff', padding: '10px 11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569', fontWeight: 700 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: summary.accent, flexShrink: 0 }} />
                              {summary.label}
                            </div>
                            <div style={{ fontSize: 24, lineHeight: 1.05, marginTop: 6, fontWeight: 800, color: '#102a43' }}>{summary.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        {people.length === 0 && (
                          <div style={{ border: '1px dashed #dbe5f0', borderRadius: 8, background: '#fff', padding: '14px 12px', fontSize: 12, color: '#64748b' }}>
                            No staff accounts are available yet.
                          </div>
                        )}
                        {filteredPeople.map(person => {
                          const account = setupAccounts[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })
                          const accountStatus = normalizeStatus(getStaffAccountStatus(account))
                          const statusCfg = STATUS_CONFIG[accountStatus] || STATUS_CONFIG['missing']
                          const isExpanded = expandedRow === person.name
                          const isInactive = accountStatus === 'inactive-account' || accountStatus === 'missing'
                          const leadership = isLeadership(person.role)

                          return (
                            <div key={`account-${person.name}`} style={{ border: '1px solid #dbe5f0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
                              {/* Summary row */}
                              <div
                                style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) minmax(110px, 0.7fr) minmax(110px, 0.7fr) auto', gap: 10, alignItems: 'center', padding: '10px 14px', cursor: 'pointer' }}
                                onClick={() => setExpandedRow(isExpanded ? null : person.name)}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 12, fontWeight: 900, color: '#102a43' }}>{person.name}</span>
                                    {leadership && <span style={{ fontSize: 9, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 5px', fontWeight: 700, textTransform: 'uppercase' }}>Leadership</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#758398', marginTop: 2 }}>{person.specialty || person.role}</div>
                                </div>

                                <div>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: statusCfg.text, background: statusCfg.bg, border: `1px solid ${statusCfg.dot}22`, borderRadius: 6, padding: '2px 8px' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
                                    {statusCfg.label}
                                  </span>
                                </div>

                                <div style={{ fontSize: 11, color: '#748297' }}>
                                  Yeshiva Ketana
                                </div>

                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {isInactive ? (
                                    <button
                                      onClick={e => { e.stopPropagation(); sendInvite(person) }}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: EMAIL_INVITES_ENABLED ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
                                      title={EMAIL_INVITES_ENABLED ? 'Send Invite' : 'Invite flow not connected'}
                                      disabled={!EMAIL_INVITES_ENABLED}
                                    >
                                      {EMAIL_INVITES_ENABLED ? 'Send Invite' : 'Invite Unavailable'}
                                    </button>
                                  ) : accountStatus === 'pending-invitation' ? (
                                    <button
                                      onClick={e => { e.stopPropagation(); sendInvite(person) }}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                      Resend Invite
                                    </button>
                                  ) : (
                                    <button
                                      onClick={e => { e.stopPropagation(); setSetupAccounts(prev => ({ ...prev, [person.name]: { ...withAttribution(account, { active: false, accountState: 'inactive' }) } })) }}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#64748b', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                      Deactivate
                                    </button>
                                  )}
                                  <span style={{ fontSize: 12, color: '#94a3b8', userSelect: 'none' }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                              </div>

                              {/* Expanded detail panel */}
                              {isExpanded && (
                                <div style={{ borderTop: '1px solid #eef2f7', background: '#f8fafc', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                  <div style={{ display: 'grid', gap: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Role</div>
                                      <div style={{ fontSize: 12, color: '#334155' }}>{person.role || '—'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Email / Username</div>
                                      {account.email ? (
                                        <div style={{ fontSize: 12, color: '#334155' }}>{account.email}</div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                          <input
                                            value={inviteEmail[person.name] || ''}
                                            onChange={e => setInviteEmail(prev => ({ ...prev, [person.name]: e.target.value }))}
                                            placeholder="Enter email to invite"
                                            spellCheck={false}
                                            onClick={e => e.stopPropagation()}
                                            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #dce4ed', fontSize: 11 }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Division Scope</div>
                                      <select
                                        value={'yeshiva-ketana'}
                                        onClick={e => e.stopPropagation()}
                                        onChange={() => {
                                          setSetupAccounts(prev => ({ ...prev, [person.name]: { ...withAttribution(account, { divisions: 'yeshiva-ketana', active: account.active !== false, accountState: account.accountState === 'missing' ? 'active' : account.accountState }) } }))
                                        }}
                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #dce4ed', fontSize: 11 }}
                                      >
                                        <option value="yeshiva-ketana">Yeshiva Ketana only</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gap: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Invited</div>
                                      <div style={{ fontSize: 12, color: '#334155' }}>
                                        {EMAIL_INVITES_ENABLED && account.invitedAt ? `${formatDate(account.invitedAt)} by ${account.invitedBy || '—'}` : '—'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Last Updated</div>
                                      <div style={{ fontSize: 12, color: '#334155' }}>
                                        {account.updatedAt ? `${formatDate(account.updatedAt)} by ${account.updatedBy || '—'}` : '—'}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                                      {accountStatus !== 'active-account' && (
                                        <button
                                          onClick={e => { e.stopPropagation(); setSetupAccounts(prev => ({ ...prev, [person.name]: { ...withAttribution(account, { active: true, accountState: 'active' }) } })) }}
                                          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                        >
                                          Activate Account
                                        </button>
                                      )}
                                      {accountStatus === 'active-account' && (
                                        <button
                                          onClick={e => { e.stopPropagation(); setSetupAccounts(prev => ({ ...prev, [person.name]: { ...withAttribution(account, { active: false, accountState: 'inactive' }) } })) }}
                                          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', fontSize: 11, cursor: 'pointer' }}
                                        >
                                          Deactivate
                                        </button>
                                      )}
                                      <button
                                        onClick={e => { e.stopPropagation(); sendInvite(person) }}
                                        style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 11, cursor: EMAIL_INVITES_ENABLED ? 'pointer' : 'not-allowed', fontWeight: 700 }}
                                        disabled={!EMAIL_INVITES_ENABLED}
                                        title={EMAIL_INVITES_ENABLED ? 'Send invitation email' : INVITES_DISABLED_MESSAGE}
                                      >
                                        {EMAIL_INVITES_ENABLED
                                          ? (accountStatus === 'pending-invitation' ? 'Resend Invite' : 'Send Invite')
                                          : 'Invite Unavailable'}
                                      </button>
                                      {typeof onPreviewAs === 'function' && (
                                        <button
                                          onClick={e => { e.stopPropagation(); onPreviewAs(person.name, person.role || 'teacher') }}
                                          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', fontSize: 11, cursor: 'pointer' }}
                                        >
                                          👁 Preview Access
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {people.length > 0 && filteredPeople.length === 0 && (
                          <div style={{ border: '1px dashed #dbe5f0', borderRadius: 8, background: '#fff', padding: '14px 12px', fontSize: 12, color: '#64748b' }}>
                            No staff accounts match these filters.
                          </div>
                        )}
                      </div>
                    </div>
  )
}


