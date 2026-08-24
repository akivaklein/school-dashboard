import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import { getStoreSyncUiState } from '../services/storeService'

type StudentLike = {
  id: number | string
  name?: string
  points?: number
  [key: string]: unknown
}

type StoreItemLike = {
  id?: number | string
  name?: string
  sku?: string
  barcode?: string
  cost?: number
  stock?: number
  lowStockAt?: number
  category?: string
  vip?: boolean
  emoji?: string
  imageUrl?: string
  [key: string]: unknown
}

type StorePurchaseLog = {
  id: number | string
  pointsEventId?: number | null
  reversedAt?: string | null
  createdAt?: string
  time: string
  studentName: string
  itemName: string
  cost: number
  [key: string]: unknown
}

type NewStoreItemState = {
  emoji: string
  name: string
  sku: string
  barcode: string
  cost: number | string
  stock: number | string
  lowStockAt: number | string
  category: string
  vip: boolean
}

type StyleBag = {
  btn: (variant: string) => CSSProperties
  badge: (color: string, bg: string) => CSSProperties
  card: CSSProperties
  tag: (color: string, background?: string) => CSSProperties
  [key: string]: unknown
}

type Props = {
  S: StyleBag
  userAccess: { canManageStore: boolean }
  showStoreManager: boolean
  setShowStoreManager: (value: boolean) => void
  storeItems: StoreItemLike[]
  updateStoreItem: (id: number | string, field: string, value: unknown) => void
  adjustStoreStock: (id: number | string, amount: number) => void
  removeStoreItem: (id: number | string) => void
  newStoreItem: NewStoreItemState
  setNewStoreItem: Dispatch<SetStateAction<NewStoreItemState>>
  addStoreItem: () => void
  storeStudent: number | string | null
  setStoreStudent: (id: number | string | null) => void
  visibleStudents: StudentLike[]
  isVIP: (student: StudentLike) => boolean
  students: StudentLike[]
  storeCategoryFilter: string
  setStoreCategoryFilter: (value: string) => void
  storeItemSearch: string
  setStoreItemSearch: (value: string) => void
  buyItem: (studentId: number, item: StoreItemLike) => void
  purchaseLog: StorePurchaseLog[]
  isStoreItemRestrictedForStudent: (student: StudentLike, item: StoreItemLike) => boolean
  STORE_CATEGORY_OPTIONS: Array<{ key: string; label: string }>
  storePersistenceReady: boolean
  storeSyncState: string
  storeLastLoadError: string
  refreshStoreData: () => void
  onReverseStoreRedemption?: (purchase: StorePurchaseLog) => Promise<void>
}

function useCompactViewport(maxWidth = 820) {
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${maxWidth}px)`).matches)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const updateCompactState = () => setIsCompact(mediaQuery.matches)

    updateCompactState()
    mediaQuery.addEventListener('change', updateCompactState)
    return () => mediaQuery.removeEventListener('change', updateCompactState)
  }, [maxWidth])

  return isCompact
}

export default function TokenStorePage({
  S,
  userAccess,
  showStoreManager,
  setShowStoreManager,
  storeItems,
  updateStoreItem,
  adjustStoreStock,
  removeStoreItem,
  newStoreItem,
  setNewStoreItem,
  addStoreItem,
  storeStudent,
  setStoreStudent,
  visibleStudents,
  isVIP,
  students,
  storeCategoryFilter,
  setStoreCategoryFilter,
  storeItemSearch,
  setStoreItemSearch,
  buyItem,
  purchaseLog,
  isStoreItemRestrictedForStudent,
  STORE_CATEGORY_OPTIONS,
  storePersistenceReady,
  storeSyncState,
  storeLastLoadError,
  refreshStoreData,
  onReverseStoreRedemption,
}: Props) {
  const [reportRange, setReportRange] = useState<'today' | 'week'>('today')
  const [studentSearch, setStudentSearch] = useState('')
  const isCompactViewport = useCompactViewport()
  const managerGridTemplate = 'minmax(180px, 1.2fr) 120px 130px 80px 110px 90px 110px 70px 96px'
  const addItemGridTemplate = isCompactViewport
    ? 'repeat(auto-fit, minmax(140px, 1fr))'
    : 'minmax(80px, 90px) minmax(160px, 1.3fr) minmax(110px, 130px) minmax(130px, 150px) repeat(4, minmax(90px, 120px)) minmax(90px, 100px) minmax(110px, 130px)'
  const storeFilterGridTemplate = isCompactViewport ? '1fr' : 'minmax(180px, 260px) 1fr'
  const studentGridTemplate = isCompactViewport ? 'repeat(auto-fit, minmax(138px, 1fr))' : 'repeat(auto-fit, minmax(165px, 1fr))'
  const itemGridTemplate = isCompactViewport ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(170px, 1fr))'
  const activityGridTemplate = isCompactViewport ? '1fr auto' : '62px minmax(90px, 1fr) minmax(90px, 1fr) minmax(80px, 1fr) 58px auto'
  const syncUi = getStoreSyncUiState({
    persistenceReady: storePersistenceReady,
    pendingSync: storeSyncState === 'pending-sync',
    syncState: storeSyncState,
  })

  const lastErrorText = storeLastLoadError || 'none'

  const redemptionReport = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    if (reportRange === 'week') start.setDate(start.getDate() - 6)

    const grouped = new Map<string, { studentName: string; staff: string; points: number; redemptions: number }>()
    purchaseLog.forEach(log => {
      if (log.reversedAt) return
      const createdAt = new Date(log.createdAt || '')
      if (Number.isNaN(createdAt.getTime()) || createdAt < start) return
      const staffName = String(log.staff || 'Unknown register')
      const key = `${String(log.studentId ?? log.studentName)}:${staffName}`
      const current = grouped.get(key) || { studentName: log.studentName, staff: staffName, points: 0, redemptions: 0 }
      current.points += Number(log.cost || 0)
      current.redemptions += 1
      grouped.set(key, current)
    })

    const rows = Array.from(grouped.values()).sort((left, right) => right.points - left.points || left.studentName.localeCompare(right.studentName))
    return {
      rows,
      totalPoints: rows.reduce((sum, row) => sum + row.points, 0),
      totalRedemptions: rows.reduce((sum, row) => sum + row.redemptions, 0),
    }
  }, [purchaseLog, reportRange])

  return (
    <div>
      {(() => {
        const lowStockItems = storeItems.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= (item.lowStockAt || 0))
        const outOfStockItems = storeItems.filter(item => (item.stock || 0) <= 0)
        const totalStock = storeItems.reduce((sum, item) => sum + (item.stock || 0), 0)
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactViewport ? 'stretch' : 'center', gap: 12, marginBottom: 10, flexDirection: isCompactViewport ? 'column' : 'row' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#16243a' }}>Token Store</h1>
                <span style={{ fontSize: 12, color: '#64748b' }}>Select student, then checkout</span>
              </div>
              {userAccess.canManageStore && (
                <button onClick={() => setShowStoreManager(!showStoreManager)} style={{ ...S.btn(showStoreManager ? 'primary' : 'ghost'), padding: '7px 12px', minHeight: 40 }}>
                  {showStoreManager ? 'Close Inventory' : 'Manage Inventory'}
                </button>
              )}
            </div>

            <div style={{ ...S.card, marginBottom: 12, padding: '10px 12px', borderLeft: `3px solid ${syncUi.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sync
                </span>
                <span style={{ ...S.badge(syncUi.color, syncUi.background), fontWeight: 700 }}>
                  {syncUi.label}
                </span>
                {syncUi.isPending && (
                  <span style={{ fontSize: 11, color: '#9a6a2a', fontWeight: 600 }}>
                    Local changes pending
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#475569' }}>
                  Last load error: {lastErrorText}
                </span>
                <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>
                  Scanner-ready: search by SKU or barcode
                </span>
                {!storePersistenceReady && storeSyncState !== 'loading' && (
                  <>
                    <span style={{ fontSize: 11, color: '#9f1239', fontWeight: 600 }}>
                      Writes are currently blocked.
                    </span>
                    <button
                      onClick={refreshStoreData}
                      style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 11 }}
                    >
                      Retry sync
                    </button>
                  </>
                )}
              </div>
            </div>

            {showStoreManager && userAccess.canManageStore && (
              <div style={{ ...S.card, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Inventory</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Update stock, token cost, VIP status, and low-stock alerts.</div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 790 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: managerGridTemplate, gap: 8, padding: '0 4px 8px', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <div>Item</div><div>SKU</div><div>Barcode</div><div>Cost</div><div>Stock</div><div>Low At</div><div>Category</div><div>VIP</div><div></div>
                    </div>

                    {storeItems.map(item => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: managerGridTemplate, gap: 8, alignItems: 'center', padding: '8px 4px', borderTop: '1px solid #eef2f7' }}>
                    <input value={item.name} onChange={e => updateStoreItem(item.id, 'name', e.target.value)} spellCheck lang="en" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input value={item.sku || ''} onChange={e => updateStoreItem(item.id, 'sku', e.target.value)} placeholder="SKU" spellCheck={false} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 12 }} />
                    <input value={item.barcode || ''} onChange={e => updateStoreItem(item.id, 'barcode', e.target.value)} placeholder="Barcode" spellCheck={false} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 12 }} />
                    <input type="number" value={item.cost} onChange={e => updateStoreItem(item.id, 'cost', e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => adjustStoreStock(item.id, -1)} style={{ ...S.btn('ghost'), padding: '6px 8px' }}>−</button>
                      <input type="number" value={item.stock} onChange={e => updateStoreItem(item.id, 'stock', e.target.value)} style={{ width: 52, padding: '8px 6px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13, textAlign: 'center' }} />
                      <button onClick={() => adjustStoreStock(item.id, 1)} style={{ ...S.btn('ghost'), padding: '6px 8px' }}>+</button>
                    </div>
                    <input type="number" value={item.lowStockAt} onChange={e => updateStoreItem(item.id, 'lowStockAt', e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <select value={item.category || 'nosh'} onChange={e => updateStoreItem(item.id, 'category', e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                      {STORE_CATEGORY_OPTIONS.filter(cat => cat.key !== 'all').map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                    <input type="checkbox" checked={item.vip} onChange={e => updateStoreItem(item.id, 'vip', e.target.checked)} />
                    <button onClick={() => removeStoreItem(item.id)} style={{ ...S.btn('ghost'), color: '#9f1239' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Add Store Item</div>
                  <div style={{ display: 'grid', gridTemplateColumns: addItemGridTemplate, gap: 8, alignItems: 'center' }}>
                    <input value={newStoreItem.emoji} onChange={e => setNewStoreItem(prev => ({ ...prev, emoji: e.target.value }))} placeholder="Icon" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input value={newStoreItem.name} onChange={e => setNewStoreItem(prev => ({ ...prev, name: e.target.value }))} placeholder="Item name" spellCheck lang="en" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input value={newStoreItem.sku} onChange={e => setNewStoreItem(prev => ({ ...prev, sku: e.target.value }))} placeholder="SKU" spellCheck={false} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input value={newStoreItem.barcode} onChange={e => setNewStoreItem(prev => ({ ...prev, barcode: e.target.value }))} placeholder="Barcode" spellCheck={false} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input type="number" value={newStoreItem.cost} onChange={e => setNewStoreItem(prev => ({ ...prev, cost: e.target.value }))} placeholder="Cost" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input type="number" value={newStoreItem.stock} onChange={e => setNewStoreItem(prev => ({ ...prev, stock: e.target.value }))} placeholder="Stock" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <input type="number" value={newStoreItem.lowStockAt} onChange={e => setNewStoreItem(prev => ({ ...prev, lowStockAt: e.target.value }))} placeholder="Low at" style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13 }} />
                    <select value={newStoreItem.category || 'nosh'} onChange={e => setNewStoreItem(prev => ({ ...prev, category: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                      {STORE_CATEGORY_OPTIONS.filter(cat => cat.key !== 'all').map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                    <label style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={newStoreItem.vip} onChange={e => setNewStoreItem(prev => ({ ...prev, vip: e.target.checked }))} /> VIP</label>
                    <button onClick={addStoreItem} style={S.btn('primary')}>Add Item</button>
                  </div>
                </div>
              </div>
            )}

            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <div style={{ ...S.card, marginBottom: 18, borderLeft: '3px solid #9a6a2a' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Inventory Attention</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[...outOfStockItems, ...lowStockItems].map(item => (
                    <span key={item.id} style={{ ...S.tag((item.stock || 0) <= 0 ? '#9f1239' : '#9a6a2a'), background: (item.stock || 0) <= 0 ? '#fff1f2' : '#f7f1e8' }}>
                      {item.name}: {(item.stock || 0) <= 0 ? 'Out' : `${item.stock} left`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      })()}

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactViewport ? 'stretch' : 'center', marginBottom: 6, gap: 8, flexDirection: isCompactViewport ? 'column' : 'row' }}>
          <div style={{ display: 'flex', alignItems: isCompactViewport ? 'stretch' : 'center', gap: 8, flexDirection: isCompactViewport ? 'column' : 'row' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students</div>
            <input
              value={studentSearch}
              onChange={event => setStudentSearch(event.target.value)}
              placeholder="Find student by name..."
              aria-label="Find student by name"
              style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12, width: isCompactViewport ? '100%' : 190, boxSizing: 'border-box' }}
            />
          </div>
          {storeStudent && <button onClick={() => setStoreStudent(null)} style={{ ...S.btn('ghost'), padding: '6px 10px' }}>Clear</button>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: studentGridTemplate, gap: 8 }}>
          {[
            { label: 'A–F', from: 'A', to: 'F' },
            { label: 'G–M', from: 'G', to: 'M' },
            { label: 'N–P', from: 'N', to: 'P' },
            { label: 'Q–Z', from: 'Q', to: 'Z' },
          ].map(group => {
            const groupStudents = visibleStudents
              .filter(s => {
                const firstLetter = (s.name || '').trim().charAt(0).toUpperCase()
                const matchesName = !studentSearch.trim() || String(s.name || '').toLowerCase().includes(studentSearch.trim().toLowerCase())
                return firstLetter >= group.from && firstLetter <= group.to && matchesName
              })
              .sort((a, b) => a.name.localeCompare(b.name))
            return { ...group, students: groupStudents }
          }).filter(group => group.students.length > 0).map(group => (
            <div key={group.label} style={{ ...S.card, padding: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.02)', borderRadius: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>{group.label}</div>
                <span style={S.badge('#64748b', '#f1f5f9')}>{group.students.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.students.map(s => {
                  const vip = isVIP(s)
                  const active = storeStudent === s.id
                  return (
                    <button key={s.id} onClick={() => setStoreStudent(storeStudent === s.id ? null : s.id)} style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6, width: '100%', minHeight: isCompactViewport ? 38 : undefined, padding: isCompactViewport ? '8px 9px' : '5px 7px', borderRadius: 8, border: `1px solid ${active ? '#334155' : vip ? '#d6b75d' : '#e2e8f0'}`, cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500, background: active ? '#334155' : vip ? '#fffaf0' : '#fbfdff', color: active ? '#fff' : '#334155', textAlign: 'left', display: storeStudent && !active ? 'none' : 'flex' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vip && '⭐ '}{s.name}</span>
                      <span style={{ color: active ? 'rgba(255,255,255,0.75)' : '#7a633a', fontWeight: 700, flexShrink: 0 }}>{s.points}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(() => {
        const s = storeStudent ? students.find(x => x.id === storeStudent) : null
        const vip = s && isVIP(s)
        const getStoreUnavailableReason = (item: any) => {
          if (!s) return ''
          if ((item.stock || 0) <= 0) return 'Out of stock'
          if (isStoreItemRestrictedForStudent(s, item)) return 'Restricted'
          if (item.vip && !vip) return 'VIP only'
          if (s.points < item.cost) return 'Need more points'
          return ''
        }
        const visibleStoreItems = storeItems.filter(item => {
          const matchesCategory = storeCategoryFilter === 'all' || (item.category || 'nosh') === storeCategoryFilter
          const q = storeItemSearch.trim().toLowerCase()
          const matchesSearch = !q
            || item.name.toLowerCase().includes(q)
            || String(item.sku || '').toLowerCase().includes(q)
            || String(item.barcode || '').toLowerCase().includes(q)
            || (item.category || '').toLowerCase().includes(q)
          return matchesCategory && matchesSearch
        })
        return (
          <div>
            <div style={{ ...S.card, marginBottom: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s?.name || 'Token Store Items'}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {s ? 'Active items can be redeemed now. Grey items are unavailable.' : 'Select a student to redeem.'}
                </div>
              </div>
              {s ? <div style={S.badge('#7a633a', '#f7f1e8')}>{s.points || 0} pts</div> : <div style={S.badge('#64748b', '#f1f5f9')}>{storeItems.length} items</div>}
            </div>

            <div style={{ ...S.card, marginBottom: 12, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: storeFilterGridTemplate, gap: 10, alignItems: 'center' }}>
                <input
                  value={storeItemSearch}
                  onChange={e => setStoreItemSearch(e.target.value)}
                  onKeyDown={event => {
                    if (event.key !== 'Enter') return
                    const scanValue = storeItemSearch.trim().toLowerCase()
                    if (!scanValue || !s) return
                    const scannedItem = storeItems.find(item => (
                      String(item.barcode || '').trim().toLowerCase() === scanValue ||
                      String(item.sku || '').trim().toLowerCase() === scanValue
                    ))
                    if (!scannedItem) return
                    event.preventDefault()
                    const unavailableReason = getStoreUnavailableReason(scannedItem)
                    if (unavailableReason) return
                    const confirmed = window.confirm(`Redeem ${scannedItem.name} for ${scannedItem.cost} points from ${s.name}?`)
                    if (!confirmed) return
                    buyItem(storeStudent as number, scannedItem)
                    setStoreItemSearch('')
                  }}
                  placeholder="Search name, SKU, or barcode..."
                  spellCheck
                  lang="en"
                  style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d8dee9', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STORE_CATEGORY_OPTIONS.map(cat => {
                    const active = storeCategoryFilter === cat.key
                    const count = cat.key === 'all' ? storeItems.length : storeItems.filter(item => (item.category || 'nosh') === cat.key).length
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setStoreCategoryFilter(cat.key)}
                        style={{
                          padding: isCompactViewport ? '8px 10px' : '7px 10px',
                          borderRadius: 8,
                          border: `1px solid ${active ? '#334155' : '#d8dee9'}`,
                          background: active ? '#334155' : '#fff',
                          color: active ? '#fff' : '#334155',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cat.label} <span style={{ opacity: active ? 0.75 : 0.55 }}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {storeStudent && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                  Student list is collapsed. Click the selected student name again to choose a different student.
                </div>
              )}
            </div>

            {vip && <div style={{ background: '#fefce8', border: '1px solid #e6cf8b', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}><div><div style={{ fontWeight: 700, color: '#854d0e' }}>VIP student: VIP items are included when in stock and affordable.</div></div></div>}
            <div style={{ display: 'grid', gridTemplateColumns: itemGridTemplate, gap: isCompactViewport ? 8 : 12 }}>
              {visibleStoreItems.map(item => {
                const unavailableReason = getStoreUnavailableReason(item)
                const unavailable = !!unavailableReason
                const disabled = !s || unavailable
                const dimUnavailable = !!s && unavailable
                return (
                  <div key={item.id} style={{ ...S.card, textAlign: 'center', opacity: dimUnavailable ? 0.48 : 1, position: 'relative', filter: dimUnavailable ? 'grayscale(1)' : 'none', boxShadow: dimUnavailable ? '0 6px 18px rgba(15,23,42,0.03)' : S.card.boxShadow, padding: isCompactViewport ? 14 : S.card.padding, minWidth: 0 }}>
                    {item.vip && <div style={{ position: 'absolute', top: 8, right: 8, background: dimUnavailable ? '#94a3b8' : '#7a633a', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>VIP</div>}
                    {dimUnavailable && <div style={{ position: 'absolute', top: 8, left: 8, background: '#e5e7eb', color: '#64748b', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{unavailableReason}</div>}
                    <div style={{ height: 48, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ maxWidth: 72, maxHeight: 48, objectFit: 'contain', borderRadius: 8 }} />
                      ) : (
                        <span style={{ fontSize: 34 }}>{item.emoji}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                    {(item.sku || item.barcode) && (
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                        {item.sku ? `SKU ${item.sku}` : 'No SKU'}
                        {item.barcode ? ` · BAR ${item.barcode}` : ''}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{STORE_CATEGORY_OPTIONS.find(c => c.key === (item.category || 'nosh'))?.label || 'Nosh'}</div>
                    <div style={{ color: dimUnavailable ? '#64748b' : '#9a6a2a', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.cost} pts</div>
                    <div style={{ fontSize: 11, color: dimUnavailable ? '#64748b' : item.stock <= item.lowStockAt ? '#9a6a2a' : '#64748b', marginBottom: 10 }}>
                      {`${item.stock} left${item.stock <= item.lowStockAt && item.stock > 0 ? ' · Low stock' : ''}`}
                    </div>
                    <button onClick={() => {
                      if (!s || disabled) return
                      const confirmed = window.confirm(`Redeem ${item.name} for ${item.cost} points from ${s.name}?`)
                      if (confirmed) buyItem(storeStudent as number, item)
                    }} disabled={disabled} style={{ ...(disabled ? S.btn('ghost') : S.btn('success')), width: '100%', minHeight: 40, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                      {!s ? 'Select student' : unavailable ? unavailableReason : 'Redeem'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 18 }}>
              {(() => {
                const lowStockItems = storeItems.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= (item.lowStockAt || 0))
                const outOfStockItems = storeItems.filter(item => (item.stock || 0) <= 0)
                const totalStock = storeItems.reduce((sum, item) => sum + (item.stock || 0), 0)
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, alignItems: 'start' }}>
                    <div style={{ ...S.card, padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Store Summary</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e7edf3', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Items</div><div style={{ fontSize: 18, fontWeight: 700 }}>{storeItems.length}</div></div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e7edf3', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Units</div><div style={{ fontSize: 18, fontWeight: 700 }}>{totalStock}</div></div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e7edf3', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Low</div><div style={{ fontSize: 18, fontWeight: 700 }}>{lowStockItems.length}</div></div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e7edf3', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Out</div><div style={{ fontSize: 18, fontWeight: 700 }}>{outOfStockItems.length}</div></div>
                      </div>
                    </div>

                    <div style={{ ...S.card, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Recent Store Activity</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Most recent persisted redemptions.</div>
                        </div>
                        <span style={S.badge('#475569', '#f1f5f9')}>{purchaseLog.length} purchases</span>
                      </div>
                      {purchaseLog.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: 12, padding: '6px 0' }}>No purchases yet today.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {purchaseLog.slice(0, 4).map(log => (
                            <div key={log.id} style={{ display: 'grid', gridTemplateColumns: activityGridTemplate, gap: 8, alignItems: 'center', padding: '7px 8px', border: '1px solid #e7edf3', borderRadius: 9, background: '#fbfdff', fontSize: 11.5 }}>
                              <span style={{ color: '#64748b' }}>{log.time}</span>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>{log.studentName}</span>
                              <span>{log.itemName}</span>
                              <span style={{ color: '#64748b' }}>{String(log.staff || 'Unknown register')}</span>
                              <span style={{ fontWeight: 700, color: '#7a633a', textAlign: 'right' }}>{log.cost} pts</span>
                              {userAccess.canManageStore && log.pointsEventId && !log.reversedAt ? (
                                <button
                                  onClick={() => onReverseStoreRedemption?.(log)}
                                  title="Reverse this redemption"
                                  style={{ ...S.btn('danger'), padding: '4px 7px', fontSize: 10, whiteSpace: 'nowrap' }}
                                >Reverse</button>
                              ) : log.reversedAt ? (
                                <span style={{ color: '#64748b', fontSize: 10 }}>Reversed</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ ...S.card, padding: 16, gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Points Redemption Report</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Points redeemed by student. Reversed redemptions are excluded.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setReportRange('today')} style={{ ...S.btn(reportRange === 'today' ? 'primary' : 'ghost'), padding: '6px 10px', fontSize: 11 }}>Today</button>
                          <button onClick={() => setReportRange('week')} style={{ ...S.btn(reportRange === 'week' ? 'primary' : 'ghost'), padding: '6px 10px', fontSize: 11 }}>Last 7 Days</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={S.badge('#475569', '#f1f5f9')}>{redemptionReport.totalPoints} points</span>
                        <span style={S.badge('#475569', '#f1f5f9')}>{redemptionReport.totalRedemptions} redemptions</span>
                      </div>
                      {redemptionReport.rows.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>No redemptions in this period.</div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ textAlign: 'left', padding: 8 }}>Student</th>
                              <th style={{ textAlign: 'left', padding: 8 }}>Checked out by</th>
                              <th style={{ textAlign: 'right', padding: 8 }}>Redemptions</th>
                              <th style={{ textAlign: 'right', padding: 8 }}>Points redeemed</th>
                            </tr></thead>
                            <tbody>{redemptionReport.rows.map(row => (
                              <tr key={row.studentName} style={{ borderBottom: '1px solid #eef2f7' }}>
                                <td style={{ padding: 8, fontWeight: 700 }}>{row.studentName}</td>
                                <td style={{ padding: 8 }}>{row.staff}</td>
                                <td style={{ padding: 8, textAlign: 'right' }}>{row.redemptions}</td>
                                <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#7a633a' }}>{row.points}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}
    </div>
  )
}