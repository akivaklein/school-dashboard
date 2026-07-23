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
  return (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>All Students</h1>
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
                        {vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⭐ VIP</span>}
                        {s.status === 'unknown' && <span style={{ background: '#fee2e2', color: '#9f1239', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>❓ Unknown</span>}
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
          </div>

  )
}
