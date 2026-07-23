type Props = {
  S: any
  students: any[]
  STAFF: any[]
  SCHEDULE_PERIODS: any[]
  THERAPY_SCHEDULE: any[]
  openStudent: (student: any, tab?: string) => void
  initials: (name: string) => string
  statusColor: Record<string, string>
  statusEmoji: Record<string, string>
  statusLabel: Record<string, string>
}

export default function SchedulePage({
  S,
  students,
  STAFF,
  SCHEDULE_PERIODS,
  THERAPY_SCHEDULE,
  openStudent,
  initials,
  statusColor,
  statusEmoji,
  statusLabel,
}: Props) {
  const studentsNotInClass = students.filter(student => student.status !== 'present')

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>🗓️ Schedule</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Schedule — Dargei Beis</div>
          {SCHEDULE_PERIODS.map((period, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: period.type === 'break' ? '#f9fafb' : '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8, opacity: period.type === 'break' ? 0.7 : 1 }}>
              {period.type === 'class' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{period.id}</div>}
              {period.type === 'break' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#e5e7eb', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>—</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{period.subject}</div>
                {period.teachers.length > 0 && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{period.teachers.join(' · ')}</div>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: period.type === 'break' ? '#94a3b8' : '#0f172a' }}>{period.time}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 Therapy Pullouts This Week</div>
            {THERAPY_SCHEDULE.map((item, index) => {
              const staffMember = STAFF.find(staff => staff.id === item.staffId)
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#5b5f7a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.day}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{item.student}</div><div style={{ fontSize: 11, color: '#64748b' }}>{staffMember?.name} · {item.type}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 700 }}>{item.time}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{item.duration}</div></div>
                </div>
              )
            })}
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Now</div>
            {studentsNotInClass.map((student, index) => {
              const withStaffObj = student.withStaff ? STAFF.find(staff => staff.id === student.withStaff) : null
              return (
                <div key={student.id} onClick={() => openStudent(student)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: student.status === 'unknown' ? '#fef2f2' : '#ffffff', borderRadius: 6, cursor: 'pointer', border: `1px solid ${student.status === 'unknown' ? '#fecaca' : '#e2e8f0'}`, marginBottom: 6 }}>
                  <div style={S.avatar(index, 28)}>{initials(student.name)}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{student.name}</div><div style={{ fontSize: 11, color: statusColor[student.status] }}>{statusEmoji[student.status]} {statusLabel[student.status]}{withStaffObj ? ` · ${withStaffObj.name}` : ''}</div></div>
                </div>
              )
            })}
            {studentsNotInClass.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>All present ✅</div>}
          </div>
        </div>
      </div>
    </div>
  )
}