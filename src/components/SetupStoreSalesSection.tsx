import { createStoreSale, updateStoreSale, deleteStoreSale } from '../services/setupCenterService'

export default function SetupStoreSalesSection({
  setupSaleDraft,
  setSetupSaleDraft,
  setSetupSales,
  setupSales,
  S,
}) {
  const handleAddSale = async () => {
    const name = setupSaleDraft.name.trim()
    if (!name) return

    try {
      const newSale = await createStoreSale({
        name,
        type: setupSaleDraft.type,
        value: setupSaleDraft.value,
        active: true
      })

      setSetupSales(previous => [...previous, newSale])

      setSetupSaleDraft({
        name: '',
        type: 'points-off',
        value: 5
      })
    } catch (error) {
      console.error('Failed to create store sale:', error)
    }
  }

  const handleToggleSaleActive = async (sale) => {
    try {
      const updatedSale = await updateStoreSale(sale.id, {
        active: !sale.active
      })

      setSetupSales(previous =>
        previous.map(item =>
          item.id === sale.id ? updatedSale : item
        )
      )
    } catch (error) {
      console.error('Failed to update store sale:', error)
    }
  }

  const handleDeleteSale = async (saleId) => {
    try {
      await deleteStoreSale(saleId)
      setSetupSales(previous => previous.filter(item => item.id !== saleId))
    } catch (error) {
      console.error('Failed to delete store sale:', error)
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
                          onClick={handleAddSale}
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
                              onClick={() => handleToggleSaleActive(sale)}
                              style={sale.active
                                ? S.btn('success')
                                : S.btn('ghost')}
                            >
                              {sale.active ? 'Active' : 'Inactive'}
                            </button>

                            <button
                              onClick={() => handleDeleteSale(sale.id)}
                              style={S.btn('danger')}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
  )
}
