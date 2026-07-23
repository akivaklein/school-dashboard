export default function SetupVipRulesSection({
  setupVipRules,
  setSetupVipRules,
  S,
}) {
  return (
                    <div style={S.card}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#223046',
                        marginBottom: 14
                      }}>
                        Automatic VIP Rules
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(3, minmax(0, 1fr))',
                        gap: 12
                      }}>
                        <label style={{ fontSize: 12, color: '#627286' }}>
                          Minimum points
                          <input
                            type="number"
                            value={setupVipRules.minimumPoints}
                            onChange={event =>
                              setSetupVipRules(previous => ({
                                ...previous,
                                minimumPoints:
                                  Number(event.target.value)
                              }))
                            }
                            style={{
                              display: 'block',
                              width: '100%',
                              boxSizing: 'border-box',
                              marginTop: 5,
                              padding: '9px 10px',
                              borderRadius: 9,
                              border: '1px solid #dce4ed'
                            }}
                          />
                        </label>

                        <label style={{ fontSize: 12, color: '#627286' }}>
                          Maximum reminders
                          <input
                            type="number"
                            value={setupVipRules.maximumReminders}
                            onChange={event =>
                              setSetupVipRules(previous => ({
                                ...previous,
                                maximumReminders:
                                  Number(event.target.value)
                              }))
                            }
                            style={{
                              display: 'block',
                              width: '100%',
                              boxSizing: 'border-box',
                              marginTop: 5,
                              padding: '9px 10px',
                              borderRadius: 9,
                              border: '1px solid #dce4ed'
                            }}
                          />
                        </label>

                        <label style={{ fontSize: 12, color: '#627286' }}>
                          Minimum attendance %
                          <input
                            type="number"
                            value={setupVipRules.minimumAttendance}
                            onChange={event =>
                              setSetupVipRules(previous => ({
                                ...previous,
                                minimumAttendance:
                                  Number(event.target.value)
                              }))
                            }
                            style={{
                              display: 'block',
                              width: '100%',
                              boxSizing: 'border-box',
                              marginTop: 5,
                              padding: '9px 10px',
                              borderRadius: 9,
                              border: '1px solid #dce4ed'
                            }}
                          />
                        </label>
                      </div>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 14,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#42556d'
                      }}>
                        <input
                          type="checkbox"
                          checked={setupVipRules.requireAll}
                          onChange={event =>
                            setSetupVipRules(previous => ({
                              ...previous,
                              requireAll: event.target.checked
                            }))
                          }
                        />
                        Require all rules to become VIP
                      </label>

                      <div style={{
                        marginTop: 16,
                        padding: 14,
                        borderRadius: 11,
                        background: '#fff9e9',
                        border: '1px solid #ead9aa',
                        color: '#765d26',
                        fontSize: 12
                      }}>
                        VIP requires {setupVipRules.minimumPoints}+ points,
                        no more than {setupVipRules.maximumReminders}
                        {' '}reminders, and {setupVipRules.minimumAttendance}%
                        attendance
                        {setupVipRules.requireAll
                          ? '. All rules are required.'
                          : '. Any rule may qualify the student.'}
                      </div>
                    </div>
  )
}
