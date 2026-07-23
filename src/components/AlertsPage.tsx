export default function AlertsPage({
  S,
  alerts,
  students,
  openStudent,
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>All Alerts ({alerts.length})</h1>
        <input
          placeholder="🔍 Search by name or type (detention, absent...)"
          id="alertSearch"
          onChange={e => {
            const v = e.target.value.toLowerCase()
            document.querySelectorAll('.alert-row').forEach((el: any) => {
              el.style.display = !v || el.dataset.search?.includes(v) ? '' : 'none'
            })
          }}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: 320, background: '#fff' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No alerts ✅</div>}
        {alerts.map((a, i) => (
          <div key={i} className="alert-row" data-search={`${a.student.toLowerCase()} ${a.msg.toLowerCase()}`}
            onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }}
            style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eef4ff', border: `1px solid ${a.type === 'danger' ? '#fecaca' : a.type === 'warn' ? '#fde68a' : '#bfdbfe'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{a.student}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{a.msg}</div>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>View →</span>
          </div>
        ))}
      </div>
    </div>
  )
}
