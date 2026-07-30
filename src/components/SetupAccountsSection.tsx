import { useMemo, useState } from 'react'
import { buildStaffAccountData, getStaffAccountStatus } from '../services/staffService'

export default function SetupAccountsSection({
  SETUP_PEOPLE,
  setupAccounts,
  setSetupAccounts,
  S,
  DIVISIONS,
  actorName,
  actorRole,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [divisionFilter, setDivisionFilter] = useState('all')

  const people = Array.isArray(SETUP_PEOPLE) ? SETUP_PEOPLE : []
  const totalUsers = people.length
  const activeCount = people.filter(person => getStaffAccountStatus(setupAccounts[person.name]) === 'active-account').length
  const disabledCount = Math.max(totalUsers - activeCount, 0)
  const adminLikeCount = people.filter(person => /admin|menahel|mashgiach/i.test(person.role || '')).length

  const filteredPeople = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return people.filter(person => {
      const account = setupAccounts[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })
      const state = getStaffAccountStatus(account)
      const active = state === 'active-account'
      const divisions = account.divisions || 'both'

      const matchesSearch = !normalized
        || String(person.name || '').toLowerCase().includes(normalized)
        || String(person.specialty || '').toLowerCase().includes(normalized)

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && active)
        || (statusFilter === 'disabled' && !active)

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

  return (
                    <div style={S.card}>
                      <div style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#102a43',
                        marginBottom: 4
                      }}>
                        Staff Accounts and Permissions
                      </div>

                      <div style={{
                        fontSize: 12,
                        color: '#52667e',
                        marginBottom: 14
                      }}>
                        Manage account status, division scope, and access controls.
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) repeat(2, minmax(140px, 180px))', gap: 8, marginBottom: 12 }}>
                        <input
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          placeholder="Search staff"
                          spellCheck
                          lang="en"
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}
                        />
                        <select
                          value={statusFilter}
                          onChange={event => setStatusFilter(event.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}
                        >
                          <option value="all">All status</option>
                          <option value="active">Active only</option>
                          <option value="disabled">Disabled only</option>
                        </select>
                        <select
                          value={divisionFilter}
                          onChange={event => setDivisionFilter(event.target.value)}
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 12 }}
                        >
                          <option value="all">All divisions</option>
                          <option value="mesivta">Mesivta</option>
                          <option value="yeshiva-ketana">Yeshiva Ketana</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
                        {[
                          { label: 'Total Users', value: totalUsers, accent: '#5b7ea5' },
                          { label: 'Admins', value: adminLikeCount, accent: '#5b7ea5' },
                          { label: 'Active', value: activeCount, accent: '#2f855a' },
                          { label: 'Disabled', value: disabledCount, accent: '#a16207' },
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

                      <div style={{ display: 'grid', gap: 8 }}>
                        {people.length === 0 && (
                          <div style={{ border: '1px dashed #dbe5f0', borderRadius: 8, background: '#fff', padding: '14px 12px', fontSize: 12, color: '#64748b' }}>
                            No staff accounts are available yet.
                          </div>
                        )}
                        {filteredPeople.map(person => {
                          const account = setupAccounts[person.name] || buildStaffAccountData({ name: person.name, role: person.role, roles: [person.role], active: true }, { divisions: 'both', accountState: 'missing' })
                          const accountStatus = getStaffAccountStatus(account)
                          const statusLabel = accountStatus === 'active-account' ? 'Active' : accountStatus === 'inactive-account' ? 'Inactive' : accountStatus === 'pending-invitation' ? 'Pending' : 'No account'
                          const nextState = account.accountState === 'pending' ? 'active' : account.active === false ? 'active' : 'inactive'

                          return (
                            <div
                              key={`account-${person.name}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) auto',
                                gap: 10,
                                alignItems: 'center',
                                padding: '10px 12px',
                                border: '1px solid #dbe5f0',
                                borderRadius: 8,
                                background: '#fff'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 900 }}>{person.name}</div>
                                <div style={{ fontSize: 10.5, color: '#758398', marginTop: 2 }}>{person.specialty}</div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4, fontWeight: 700 }}>{statusLabel}</div>
                              </div>

                              <select
                                value={account.divisions || 'both'}
                                onChange={event =>
                                  setSetupAccounts(previous => ({
                                    ...previous,
                                    [person.name]: {
                                      ...withAttribution(account, {
                                      divisions: event.target.value,
                                      active: account.active !== false,
                                      accountState: account.accountState === 'missing' ? 'active' : account.accountState,
                                      }),
                                    }
                                  }))
                                }
                                style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #dce4ed', fontSize: 11 }}
                              >
                                <option value="both">Both divisions</option>
                                <option value="mesivta">Mesivta</option>
                                <option value="yeshiva-ketana">Yeshiva Ketana</option>
                              </select>

                              <div style={{ display: 'grid', gap: 6 }}>
                                <button
                                  onClick={() =>
                                    setSetupAccounts(previous => ({
                                      ...previous,
                                      [person.name]: {
                                        ...withAttribution(account, {
                                        active: nextState === 'active',
                                        accountState: nextState === 'active' ? 'active' : 'inactive',
                                        }),
                                      }
                                    }))
                                  }
                                  style={account.active !== false ? S.btn('success') : S.btn('ghost')}
                                >
                                  {account.active !== false ? 'Active' : 'Inactive'}
                                </button>
                                <button
                                  onClick={() =>
                                    setSetupAccounts(previous => ({
                                      ...previous,
                                      [person.name]: {
                                        ...withAttribution(account, {
                                        active: true,
                                        accountState: 'pending',
                                        invitedAt: new Date().toISOString(),
                                        invitedBy: actorName || 'System',
                                        invitedByRole: actorRole || 'admin',
                                        }),
                                      }
                                    }))
                                  }
                                  style={S.btn('ghost')}
                                >
                                  Resend Invite
                                </button>
                              </div>

                              <button
                                onClick={() =>
                                  setSetupAccounts(previous => ({
                                    ...previous,
                                    [person.name]: {
                                      ...withAttribution(account, {
                                      active: true,
                                      accountState: account.accountState === 'active' ? 'active' : 'pending',
                                      divisions: account.divisions || 'both',
                                      invitedAt: account.accountState === 'active' ? account.invitedAt : new Date().toISOString(),
                                      invitedBy: account.accountState === 'active' ? account.invitedBy : (actorName || 'System'),
                                      invitedByRole: account.accountState === 'active' ? account.invitedByRole : (actorRole || 'admin'),
                                      }),
                                    }
                                  }))
                                }
                                style={S.btn('ghost')}
                              >
                                {account.accountState === 'missing' ? 'Create Account' : 'Manage'}
                              </button>
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
