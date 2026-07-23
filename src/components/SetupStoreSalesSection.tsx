export default function SetupStoreSalesSection({
  setupSaleDraft,
  setSetupSaleDraft,
  setSetupSales,
  setupSales,
  S,
}) {
  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '0.8fr 1.2fr',
                      gap: 16
                    }}>
                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Create Sale
                        </div>

                        <input
                          value={setupSaleDraft.name}
                          onChange={event =>
                            setSetupSaleDraft(previous => ({
                              ...previous,
                              name: event.target.value
                            }))
                          }
                          placeholder="Sale name"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 10px',
                            borderRadius: 9,
                            border: '1px solid #dce4ed',
                            marginBottom: 10
                          }}
                        />

                        <select
                          value={setupSaleDraft.type}
                          onChange={event =>
                            setSetupSaleDraft(previous => ({
                              ...previous,
                              type: event.target.value
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
                        >
                          <option value="points-off">
                            Points off
                          </option>
                          <option value="percent-off">
                            Percent off
                          </option>
                          <option value="vip-special">
                            VIP special
                          </option>
                        </select>

                        <input
                          type="number"
                          value={setupSaleDraft.value}
                          onChange={event =>
                            setSetupSaleDraft(previous => ({
                              ...previous,
                              value: Number(event.target.value)
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
                        />

                        <button
                          onClick={() => {
                            const name = setupSaleDraft.name.trim()
                            if (!name) return

                            setSetupSales(previous => [
                              ...previous,
                              {
                                id: `sale-${Date.now()}`,
                                ...setupSaleDraft,
                                name,
                                active: true
                              }
                            ])

                            setSetupSaleDraft({
                              name: '',
                              type: 'points-off',
                              value: 5
                            })
                          }}
                          style={S.btn('primary')}
                        >
                          Create Sale
                        </button>
                      </div>

                      <div style={S.card}>
                        <div style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: '#223046',
                          marginBottom: 12
                        }}>
                          Sales
                        </div>

                        {setupSales.map(sale => (
                          <div
                            key={sale.id}
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'center',
                              padding: '11px 12px',
                              border: '1px solid #e0e7ef',
                              borderRadius: 10,
                              marginBottom: 8
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: 12,
                                fontWeight: 900
                              }}>
                                {sale.name}
                              </div>

                              <div style={{
                                fontSize: 10.5,
                                color: '#758398',
                                marginTop: 3
                              }}>
                                {sale.type} · {sale.value}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                setSetupSales(previous =>
                                  previous.map(item =>
                                    item.id === sale.id
                                      ? {
                                          ...item,
                                          active: !item.active
                                        }
                                      : item
                                  )
                                )
                              }
                              style={sale.active
                                ? S.btn('success')
                                : S.btn('ghost')}
                            >
                              {sale.active ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
  )
}
