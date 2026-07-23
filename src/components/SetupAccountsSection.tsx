export default function SetupAccountsSection({
  SETUP_PEOPLE,
  setupAccounts,
  setSetupAccounts,
  S,
}) {
  return (
                    <div style={S.card}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#223046',
                        marginBottom: 5
                      }}>
                        Staff Accounts & Access
                      </div>

                      <div style={{
                        fontSize: 11,
                        color: '#718096',
                        marginBottom: 14
                      }}>
                        Real passwords should be handled by Supabase Auth.
                        This page controls demo account access and provides
                        reset placeholders without displaying passwords.
                      </div>

                      <div style={{
                        display: 'grid',
                        gap: 8
                      }}>
                        {SETUP_PEOPLE.map(person => {
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
                                border: '1px solid #e0e7ef',
                                borderRadius: 10,
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
