import { createTeachingAction, deleteTeachingAction } from '../services/setupCenterService'

export default function SetupTeachingConfigSection({
  setupActionDraft,
  setSetupActionDraft,
  setSetupCustomActions,
  setupCustomActions,
  S,
}) {
  async function handleAddAction() {
    const label = setupActionDraft.label.trim()
    if (!label) return

    try {
      const created = await createTeachingAction({
        label,
        points: Number(setupActionDraft.points || 0),
        category: setupActionDraft.category,
      })

      setSetupCustomActions(previous => [...previous, created])
      setSetupActionDraft({
        label: '',
        points: 1,
        category: 'Praise'
      })
    } catch (error) {
      console.error('Failed to create teaching action:', error)
      alert('Unable to add action. Please try again.')
    }
  }

  async function handleRemoveAction(actionId: string) {
    try {
      await deleteTeachingAction(actionId)
      setSetupCustomActions(previous =>
        previous.filter(item => item.id !== actionId)
      )
    } catch (error) {
      console.error('Failed to delete teaching action:', error)
      alert('Unable to remove action. Please try again.')
    }
  }

  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 16
                    }}>
                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Add Teaching Action
                        </div>

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Reason
                        </label>

                        <input
                          value={setupActionDraft.label}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              label: event.target.value
                            }))
                          }
                          placeholder="Example: Brought back homework"
                          spellCheck
                          lang="en"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 10
                          }}
                        />

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Point amount
                        </label>

                        <input
                          type="number"
                          min="-20"
                          max="20"
                          value={setupActionDraft.points}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              points: Number(event.target.value)
                            }))
                          }
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 10
                          }}
                        />

                        <label style={{
                          display: 'block',
                          fontSize: 11,
                          color: '#718096',
                          marginBottom: 5
                        }}>
                          Category
                        </label>

                        <select
                          value={setupActionDraft.category}
                          onChange={event =>
                            setSetupActionDraft(previous => ({
                              ...previous,
                              category: event.target.value
                            }))
                          }
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 12
                          }}
                        >
                          <option>Praise</option>
                          <option>Responsibility</option>
                          <option>Academic</option>
                          <option>Behavior Deduction</option>
                          <option>Other</option>
                        </select>

                        <button
                          onClick={handleAddAction}
                          style={S.btn('primary')}
                        >
                          Add Action
                        </button>
                      </div>

                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Custom Teaching Actions
                        </div>

                        <div style={{
                          display: 'grid',
                          gap: 8
                        }}>
                          {setupCustomActions.map(action => (
                            <div
                              key={action.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '11px 12px',
                                border: '1px solid #e0e7ef',
                                borderRadius: 10,
                                background: '#ffffff'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: '#2b3d54'
                                }}>
                                  {action.label}
                                </div>

                                <div style={{
                                  fontSize: 10.5,
                                  color: '#758398',
                                  marginTop: 3
                                }}>
                                  {action.category}
                                </div>
                              </div>

                              <div style={{
                                fontSize: 14,
                                fontWeight: 900,
                                color:
                                  action.points >= 0
                                    ? '#4f735a'
                                    : '#9b4358'
                              }}>
                                {action.points > 0 ? '+' : ''}
                                {action.points}
                              </div>

                              <button
                                onClick={() =>
                                  handleRemoveAction(action.id)
                                }
                                style={{
                                  border: 'none',
                                  background: '#f5f7fa',
                                  color: '#8a5160',
                                  borderRadius: 7,
                                  padding: '6px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <div style={{
                          color: '#68778a',
                          fontSize: 11
                        }}>
                          These are saved as demo settings in this browser
                          session. A following integration patch can place
                          them directly inside the Teaching Mode Class
                          Actions drawer.
                        </div>
                      </div>
                    </div>
  )
}
