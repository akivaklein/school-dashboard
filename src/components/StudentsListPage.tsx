import { useMemo, useState } from 'react'
import { matchesContextualSearch } from '../utils/contextualSearch'

export default function StudentsListPage({
  searchedStudents,
  openStudent,
  S,
  STAFF,
  getImprovement,
  isVIP,
  statusColor,
  statusEmoji,
  statusLabel,
  daysSince,
  initials,
}) {
  const [viewMode, setViewMode] = useState('cards')
  const [tableSearch, setTableSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const pageSize = 12

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return searchedStudents

    return searchedStudents.filter(student =>
      matchesContextualSearch(q, [student.name, student.id, student.className, student.division])
    )
  }, [searchedStudents, tableSearch])

  const sortedRows = useMemo(() => {
    const rows = filteredRows.slice()
    rows.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      if (sortBy === 'name') {
        aValue = a.name || ''
        bValue = b.name || ''
      } else if (sortBy === 'id') {
        aValue = Number(a.id) || 0
        bValue = Number(b.id) || 0
      } else if (sortBy === 'className') {
        aValue = a.className || ''
        bValue = b.className || ''
      } else if (sortBy === 'points') {
        aValue = Number(a.points) || 0
        bValue = Number(b.points) || 0
      } else if (sortBy === 'reminders') {
        aValue = Number(a.reminders) || 0
        bValue = Number(b.reminders) || 0
      } else if (sortBy === 'attendance') {
        aValue = a.att?.filter(d => d === 'P').length || 0
        bValue = b.att?.filter(d => d === 'P').length || 0
      }

      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [filteredRows, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const tableRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(column)
    setSortDir('asc')
  }

  function SortHead({ label, column }) {
    const active = sortBy === column
    return (
      <button
        onClick={() => toggleSort(column)}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          fontSize: 12,
          fontWeight: 800,
          color: active ? '#1e293b' : '#64748b',
          cursor: 'pointer',
        }}
      >
        {label}{active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
      </button>
    )
  }

  return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#16243a' }}>Students</h1>
                <div style={{ fontSize: 12, color: '#64748b' }}>{searchedStudents.length} students</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={tableSearch}
                  onChange={event => {
                    setTableSearch(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search name, class, id"
                  spellCheck
                  lang="en"
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d8dee9', fontSize: 12, width: 'min(100%, 260px)' }}
                />
                <button onClick={() => setViewMode('cards')} style={{ ...S.btn(viewMode === 'cards' ? 'primary' : 'ghost'), padding: '8px 12px', fontSize: 12 }}>Cards</button>
                <button onClick={() => setViewMode('table')} style={{ ...S.btn(viewMode === 'table' ? 'primary' : 'ghost'), padding: '8px 12px', fontSize: 12 }}>Table</button>
              </div>
            </div>

            {viewMode === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchedStudents.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                const imp = getImprovement(s)
                const vip = isVIP(s)
                return (
                  <div key={s.id} onClick={() => openStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px', borderLeft: vip ? '4px solid #ca8a04' : s.status === 'unknown' ? '4px solid #9f1239' : '1px solid #e2e8f0' }}>
                    <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.name}
                        {vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>VIP</span>}
                        {s.status === 'unknown' && <span style={{ background: '#fee2e2', color: '#9f1239', padding: '1px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Unknown</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                        {withStaffObj && <span style={{ fontSize: 11, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, color: imp.color }}>{imp.icon} {imp.label}</span>
                        {s.iep && <span style={S.tag('#5b5f7a')}>IEP</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                      <div><div style={{ fontSize: 17, fontWeight: 700, color: '#9a6a2a' }}>{s.points}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>pts</div></div>
                      <div><div style={{ fontSize: 17, fontWeight: 700, color: s.reminders >= 4 ? '#9f1239' : '#334155' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>remind.</div></div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{s.att.filter(d=>d==='P').length}/6</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>days</div>
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 2 }}>
                          <div style={{ width: `${Math.round(s.att.filter(d=>d==='P').length/6*100)}%`, height: '100%', background: s.att.filter(d=>d==='P').length >= 5 ? '#56765f' : s.att.filter(d=>d==='P').length >= 3 ? '#9a6a2a' : '#9f1239', borderRadius: 2 }} />
                        </div>
                      </div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d` : 'Never'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>last call</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
            )}

            {viewMode === 'table' && (
              <div style={S.card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Student" column="name" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="ID" column="id" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Class" column="className" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Points" column="points" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Reminders" column="reminders" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}><SortHead label="Attendance" column="attendance" /></th>
                        <th style={{ textAlign: 'left', padding: 10 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((student, index) => {
                        const withStaffObj = student.withStaff ? STAFF.find(st => st.id === student.withStaff) : null
                        const presentDays = student.att?.filter(day => day === 'P').length || 0
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                            <td style={{ padding: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={S.avatar(index, 28)}>{initials(student.name)}</div>
                                <div style={{ fontWeight: 700 }}>{student.name}</div>
                              </div>
                            </td>
                            <td style={{ padding: 10 }}>{student.id}</td>
                            <td style={{ padding: 10 }}>{student.className || '—'}</td>
                            <td style={{ padding: 10 }}>
                              <span style={S.tag(statusColor[student.status])}>{statusEmoji[student.status]} {statusLabel[student.status]}</span>
                              {withStaffObj && <div style={{ fontSize: 10, color: '#3f6b76', marginTop: 3 }}>With {withStaffObj.name}</div>}
                            </td>
                            <td style={{ padding: 10, fontWeight: 700, color: '#9a6a2a' }}>{student.points}</td>
                            <td style={{ padding: 10, fontWeight: 700, color: student.reminders >= 4 ? '#9f1239' : '#334155' }}>{student.reminders}</td>
                            <td style={{ padding: 10 }}>{presentDays}/6</td>
                            <td style={{ padding: 10 }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button onClick={() => openStudent(student)} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Open</button>
                                <button onClick={() => openStudent(student, 'calls')} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Calls</button>
                                <button onClick={() => openStudent(student, 'notes')} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Notes</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {tableRows.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>No students match current filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Page {safePage} of {totalPages}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={safePage === 1} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Previous</button>
                    <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 11 }}>Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>

  )
}
