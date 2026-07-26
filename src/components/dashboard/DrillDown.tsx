type DrillDownProps = {
  title: string
  students: any[]
  onClose: () => void
  onSelectStudent: (student: any) => void
  isVIP?: (student: any) => boolean
  staff: any[]
  styles: any
  initials: (name: string) => string
  statusColor: Record<string, string>
  statusEmoji: Record<string, string>
  statusLabel: Record<string, string>
}

export default function DrillDown({
  title,
  students,
  onClose,
  onSelectStudent,
  isVIP,
  staff,
  styles,
  initials,
  statusColor,
  statusEmoji,
  statusLabel,
}: DrillDownProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' }}>
        <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title} <span style={{ opacity: 0.6, fontSize: 13 }}>({students.length})</span></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {students.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No students</div>}
          {students.map((student, index) => {
            const withStaffObj = student.withStaff ? staff.find(member => member.id === student.withStaff) : null
            const vip = isVIP ? isVIP(student) : false

            return (
              <div key={student.id} onClick={() => onSelectStudent(student)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8, cursor: 'pointer', background: '#ffffff' }}>
                <div style={styles.avatar(index, 40)}>{initials(student.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {student.name}
                    {vip && <span style={{ background: '#854d0e', color: '#fef9c3', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>⭐ VIP</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={styles.tag(statusColor[student.status])}>{statusEmoji[student.status]} {statusLabel[student.status]}</span>
                    {withStaffObj && <span style={{ fontSize: 11, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: '#9a6a2a' }}>{student.points}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>pts</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: student.reminders >= 4 ? '#9f1239' : '#334155' }}>{student.reminders}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>remind.</div></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
