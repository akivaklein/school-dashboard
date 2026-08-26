import { useEffect, useMemo, useState } from 'react'
import { buildStaffAccountData, getStaffAccountStatus } from '../services/staffService'
import { inviteDashboardUser, listDashboardUsers, updateDashboardUser, type ManagedDashboardUser } from '../services/userManagementService'
import { defaultPermissionsForRole, mergePermissionsForRole, PERMISSION_LEVELS, PERMISSION_SECTIONS, type PermissionMatrix } from '../utils/permissions'

const INVITES_READY_MESSAGE = 'Invites are sent by Supabase Auth. New users open the email link, set their password, and then sign in normally.'

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
  const [managedUsers, setManagedUsers] = useState<ManagedDashboardUser[]>([])
  const [loadingManagedUsers, setLoadingManagedUsers] = useState(false)
  const [inviteDraft, setInviteDraft] = useState({ displayName: '', email: '', role: 'teacher', permissions: defaultPermissionsForRole('teacher') })
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  const people = Array.isArray(SETUP_PEOPLE) ? SETUP_PEOPLE : []
  const totalUsers = people.length
  const normalizeStatus = (status: string) => {
    return status
  }

  const activeCount = people.filter(person => normalizeStatus(getStaffAccountStatus(setupAccounts[person.name])) === 'active-account').length
  const pendingCount = managedUsers.filter(user => user.active && !user.lastSignInAt).length
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

  async function loadManagedUsers() {
    setLoadingManagedUsers(true)
    try {
      setManagedUsers(await listDashboardUsers())
    } catch (error) {
      setInviteBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to load users.' })
    } finally {
      setLoadingManagedUsers(false)
    }
  }

  useEffect(() => {
    void loadManagedUsers()
  }, [])

  function updateInviteDraftRole(role: string) {
    setInviteDraft(previous => ({ ...previous, role, permissions: defaultPermissionsForRole(role) }))
  }

  function updatePermission(base: PermissionMatrix, section: string, level: string): PermissionMatrix {
    if (!PERMISSION_LEVELS.includes(level as PermissionMatrix[string])) return base
    return { ...base, [section]: level as PermissionMatrix[string] }
  }

  async function handleInviteUser() {
    setInviteBanner(null)
    try {
      await inviteDashboardUser({
        displayName: inviteDraft.displayName.trim(),
        email: inviteDraft.email.trim(),
        role: inviteDraft.role,
        permissions: inviteDraft.permissions,
      })
      setInviteBanner({ tone: 'success', text: `Invite sent to ${inviteDraft.email.trim()}.` })
      setInviteDraft({ displayName: '', email: '', role: 'teacher', permissions: defaultPermissionsForRole('teacher') })
      await loadManagedUsers()
    } catch (error) {
      setInviteBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to invite user.' })
    }
  }

  async function handleUpdateManagedUser(user: ManagedDashboardUser) {
    setSavingUserId(user.id)
    setInviteBanner(null)
    try {
      await updateDashboardUser({
        userId: user.id,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        permissions: user.permissions,
      })
      setInviteBanner({ tone: 'success', text: `${user.displayName || user.email} updated.` })
      await loadManagedUsers()
    } catch (error) {
      setInviteBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to update user.' })
    } finally {
      setSavingUserId(null)
    }
  }

  function patchManagedUser(userId: string, patch: Partial<ManagedDashboardUser>) {
    setManagedUsers(previous => previous.map(user => (
      user.id === userId
        ? { ...user, ...patch, permissions: patch.permissions ? mergePermissionsForRole(patch.role || user.role, patch.permissions) : user.permissions }
        : user
    )))
  }

  async function sendInvite(person) {
    const account = setupAccounts[person.name]
    const email = (inviteEmail[person.name] || account?.email || '').trim()
    if (!email) {
      setInviteBanner({ tone: 'error', text: 'Enter an email address before sending an invite.' })
      return
    }

    try {
      await inviteDashboardUser({
        displayName: person.name,
        email,
        role: person.role || 'teacher',
        permissions: defaultPermissionsForRole(person.role || 'teacher'),
      })
      setSetupAccounts(previous => ({
        ...previous,
        [person.name]: {
          ...(previous[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })),
          ...withAttribution(previous[person.name] || {}, {
            active: true,
            accountState: 'pending',
            email,
            invitedAt: new Date().toISOString(),
            invitedBy: actorName || 'System',
            invitedByRole: actorRole || 'admin',
          }),
        }
      }))
      setInviteBanner({ tone: 'success', text: `Invite sent to ${email}.` })
      await loadManagedUsers()
    } catch (error) {
      setInviteBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to send invite.' })
    }
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

                      <div style={{ marginBottom: 12, borderRadius: 8, padding: '8px 10px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 12, fontWeight: 700 }}>
                        {INVITES_READY_MESSAGE}
                      </div>

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
                          <option value="pending">Pending invite</option>
                          <option value="disabled">Inactive / No account</option>
                        </select>
                        <select value={divisionFilter} onChange={event => setDivisionFilter(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}>
                          <option value="all">All divisions</option>
                          <option value="yeshiva-ketana">Yeshiva Ketana</option>
                        </select>
                      </div>

                      <div style={{ border: '1px solid #dbe5f0', borderRadius: 10, padding: 12, background: '#fbfdff', marginBottom: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#102a43', marginBottom: 8 }}>Add / Invite User</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) minmax(180px, 1fr) minmax(130px, 160px) auto', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                          <input value={inviteDraft.displayName} onChange={event => setInviteDraft(previous => ({ ...previous, displayName: event.target.value }))} placeholder="Name" spellCheck lang="en" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }} />
                          <input value={inviteDraft.email} onChange={event => setInviteDraft(previous => ({ ...previous, email: event.target.value }))} placeholder="Email" spellCheck={false} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }} />
                          <select value={inviteDraft.role} onChange={event => updateInviteDraftRole(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12, background: '#fff' }}>
                            <option value="admin">Admin</option>
                            <option value="teacher">Teacher</option>
                            <option value="rebbe">Rebbe</option>
                            <option value="support_staff">Support staff</option>
                            <option value="register">Register</option>
                          </select>
                          <button onClick={handleInviteUser} style={S.btn('primary')}>Send Invite</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                          {PERMISSION_SECTIONS.map(section => (
                            <label key={section.key} style={{ display: 'grid', gap: 3, fontSize: 10, color: '#64748b', fontWeight: 800 }}>
                              {section.label}
                              <select value={inviteDraft.permissions[section.key] || 'none'} onChange={event => setInviteDraft(previous => ({ ...previous, permissions: updatePermission(previous.permissions, section.key, event.target.value) }))} style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid #dce4ed', background: '#fff', fontSize: 11 }}>
                                {PERMISSION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                              </select>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ border: '1px solid #dbe5f0', borderRadius: 10, padding: 12, background: '#fff', marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#102a43' }}>Existing Secure Users</div>
                          <button onClick={loadManagedUsers} style={{ ...S.btn('ghost'), padding: '5px 10px', fontSize: 11 }}>{loadingManagedUsers ? 'Loading...' : 'Refresh'}</button>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {managedUsers.map(user => (
                            <div key={user.id} style={{ border: '1px solid #eef2f7', borderRadius: 9, padding: 10, display: 'grid', gap: 8 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(170px, 1fr) minmax(120px, 150px) auto auto', gap: 8, alignItems: 'center' }}>
                                <input value={user.displayName} onChange={event => patchManagedUser(user.id, { displayName: event.target.value })} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #dce4ed', fontSize: 12 }} />
                                <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || 'No email'}</div>
                                <select value={user.role} onChange={event => patchManagedUser(user.id, { role: event.target.value, permissions: defaultPermissionsForRole(event.target.value) })} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #dce4ed', fontSize: 12, background: '#fff' }}>
                                  <option value="admin">Admin</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="rebbe">Rebbe</option>
                                  <option value="support_staff">Support staff</option>
                                  <option value="register">Register</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#475569' }}><input type="checkbox" checked={user.active} onChange={event => patchManagedUser(user.id, { active: event.target.checked })} /> Active</label>
                                <button onClick={() => handleUpdateManagedUser(user)} disabled={savingUserId === user.id} style={{ ...S.btn('primary'), padding: '6px 10px', fontSize: 11 }}>{savingUserId === user.id ? 'Saving...' : 'Save'}</button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 7 }}>
                                {PERMISSION_SECTIONS.map(section => (
                                  <label key={section.key} style={{ display: 'grid', gap: 3, fontSize: 10, color: '#64748b', fontWeight: 800 }}>
                                    {section.label}
                                    <select value={user.permissions[section.key] || 'none'} onChange={event => patchManagedUser(user.id, { permissions: updatePermission(user.permissions, section.key, event.target.value) })} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #dce4ed', background: '#fff', fontSize: 11 }}>
                                      {PERMISSION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                                    </select>
                                  </label>
                                ))}
                              </div>
                              <div style={{ fontSize: 10.5, color: '#94a3b8' }}>Created {formatDate(user.createdAt || undefined)} · Last sign-in {formatDate(user.lastSignInAt || undefined)} · Deactivation preserves history.</div>
                            </div>
                          ))}
                          {!managedUsers.length && <div style={{ color: '#94a3b8', fontSize: 12 }}>{loadingManagedUsers ? 'Loading users...' : 'No secure users loaded yet.'}</div>}
                        </div>
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
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                      title="Send Invite"
                                    >
                                      Send Invite
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
                                        {account.invitedAt ? `${formatDate(account.invitedAt)} by ${account.invitedBy || '—'}` : '—'}
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
                                        style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                                        title="Send invitation email"
                                      >
                                        {accountStatus === 'pending-invitation' ? 'Resend Invite' : 'Send Invite'}
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


