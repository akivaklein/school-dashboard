export default function SetupAccountsSection({
  SETUP_PEOPLE,
  setupAccounts,
  setSetupAccounts,
  S,
  DIVISIONS,
}) {
  const people = Array.isArray(SETUP_PEOPLE) ? SETUP_PEOPLE : []
  const totalUsers = people.length
  const activeCount = people.filter(person => (setupAccounts[person.name]?.active ?? true)).length
  const disabledCount = Math.max(totalUsers - activeCount, 0)
  const adminLikeCount = people.filter(person => /admin|menahel|mashgiach/i.test(person.role || '')).length

  return (
                    <div style={S.card}>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: '#102a43',
                        marginBottom: 4
                      }}>
                        User Management & Permissions
                      </div>

                      <div style={{
                        fontSize: 12,
                        color: '#52667e',
                        marginBottom: 14
                      }}>
                        Manage account status, division scope, and access controls for staff.
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
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

                      <div style={{
                        display: 'grid',
                        gap: 8
                      }}>
                        {people.map(person => {
                          const account =
                            setupAccounts[person.name] || {
                              active: true,
                              divisions: 'both'
                            }

                          return (
                            <div
                              key={`account-${person.name}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  '1.2fr 0.8fr 0.8fr auto',
                                gap: 10,
                                alignItems: 'center',
                                padding: '10px 12px',
                                border: '1px solid #dbe5f0',
                                borderRadius: 8,
                                background: '#fff'
                              }}
                            >
                              <div>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: 900
                                }}>
                                  {person.name}
                                </div>

                                <div style={{
                                  fontSize: 10.5,
                                  color: '#758398',
                                  marginTop: 2
                                }}>
                                  {person.specialty}
                                </div>
                              </div>

                              <select
                                value={account.divisions}
                                onChange={event =>
                                  setSetupAccounts(previous => ({
                                    ...previous,
                                    [person.name]: {
                                      ...account,
                                      divisions: event.target.value
                                    }
                                  }))
                                }
                                style={{
                                  padding: '7px 8px',
                                  borderRadius: 8,
                                  border: '1px solid #dce4ed',
                                  fontSize: 11
                                }}
                              >
                                <option value="both">
                                  Both divisions
                                </option>
                                <option value="mesivta">
                                  Mesivta
                                </option>
                                <option value="yeshiva-ketana">
                                  Yeshiva Ketana
                                </option>
                              </select>

                              <button
                                onClick={() =>
                                  setSetupAccounts(previous => ({
                                    ...previous,
                                    [person.name]: {
                                      ...account,
                                      active: !account.active
                                    }
                                  }))
                                }
                                style={account.active
                                  ? S.btn('success')
                                  : S.btn('ghost')}
                              >
                                {account.active
                                  ? 'Active'
                                  : 'Disabled'}
                              </button>

                              <button
                                onClick={() =>
                                  alert(
                                    `Demo password reset requested for ${person.name}.`
                                  )
                                }
                                style={S.btn('ghost')}
                              >
                                Reset Access
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
  )
}
