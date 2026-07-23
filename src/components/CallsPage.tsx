export default function CallsPage({
  S,
  students,
  openStudent,
  daysSince,
  initials,
}) {
  return (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Parent Call Log</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {students.map((s, i) => { const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null; const days = lastCall ? daysSince(lastCall.date) : 999; return (<div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${days > 14 ? '#9a6a2a' : '#56765f'}`, padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={S.avatar(i, 32)}>{initials(s.name)}</div><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: days > 14 ? '#ea580c' : '#56765f', fontWeight: 600 }}>{lastCall ? `Last call: ${days} days ago` : '⚠️ Never called'}</div></div><div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{s.parentCalls.length} calls</div></div>{lastCall && <div style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>{lastCall.notes}</div>}</div>) })}
            </div>
          </div>

  )
}
