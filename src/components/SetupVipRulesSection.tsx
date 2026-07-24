export default function SetupVipRulesSection({
  setupVipRules,
  setSetupVipRules,
  S,
}) {
  async function handleSaveVIPRules() {
    try {
      const { updateVIPRules } = await import('../services/setupCenterService')
      await updateVIPRules({
        minimum_points: setupVipRules.minimumPoints,
        maximum_reminders: setupVipRules.maximumReminders,
        minimum_attendance: setupVipRules.minimumAttendance,
        require_all: setupVipRules.requireAll,
      })
    } catch (error) {
      console.error('Failed to save VIP rules:', error)
      alert('Unable to save VIP rules. Please try again.')
    }
  }

  const handleMinPointsChange = (value: number) => {
    setSetupVipRules(previous => ({
      ...previous,
      minimumPoints: value
    }))
  }

  const handleMaxRemindersChange = (value: number) => {
    setSetupVipRules(previous => ({
      ...previous,
      maximumReminders: value
    }))
  }

  const handleMinAttendanceChange = (value: number) => {
    setSetupVipRules(previous => ({
      ...previous,
      minimumAttendance: value
    }))
  }

  const handleRequireAllChange = (checked: boolean) => {
    setSetupVipRules(previous => ({
      ...previous,
      requireAll: checked
    }))
  }
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
                              handleMinPointsChange(Number(event.target.value))
                            }
                            onBlur={handleSaveVIPRules}
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
                              handleMaxRemindersChange(Number(event.target.value))
                            }
                            onBlur={handleSaveVIPRules}
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
                              handleMinAttendanceChange(Number(event.target.value))
                            }
                            onBlur={handleSaveVIPRules}
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
                          onChange={event => {
                            handleRequireAllChange(event.target.checked)
                          }}
                          onBlur={handleSaveVIPRules}
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
