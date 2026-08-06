export default function AdminOfficeDashboardPage(props: any) {
  const {
    S,
    getGreeting,
    userName,
    LiveClock,
    setPage,
    storeItems,
    openStudent,
    callsDueStudents,
    setDrillDown,
    inClassroomsStudents,
    lateStudents,
    leftEarlyStudents,
    absentTodayStudents,
    unknown,
    urgentStudents,
  } = props

  const callsDue = (callsDueStudents || []).slice(0, 6)
  const lowStockCount = (storeItems || []).filter((item: any) => (item.stock || 0) <= (item.lowStockAt || 0)).length

  function ClickCard({ label, value, color, sub, onClick }: any) {
    return (
      <div
        onClick={onClick}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${color}`,
          boxShadow: '0 7px 18px rgba(30,41,59,0.045)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={(event: any) => {
          if (!onClick) return
          event.currentTarget.style.boxShadow = '0 12px 28px rgba(30,41,59,0.10)'
          event.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(event: any) => {
          event.currentTarget.style.boxShadow = '0 7px 18px rgba(30,41,59,0.045)'
          event.currentTarget.style.transform = 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {onClick && <span style={{ fontSize: 10, color: '#94a3b8' }}>click →</span>}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 22,
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px 26px',
          color: '#223046',
          boxShadow: '0 8px 22px rgba(30,41,59,0.05)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#708196',
                marginBottom: 9,
              }}
            >
              Office Command Desk
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.045em', color: '#111827' }}>
              {getGreeting(new Date().getHours())}, {userName}
            </h1>
            <p style={{ color: '#64748b', margin: '9px 0 0', fontSize: 13 }}>
              <LiveClock /> · Daily school operations for enrolled students
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => setPage('calls')} style={S.btn('primary')}>Open Parent Calls</button>
            <button onClick={() => setPage('attendance')} style={S.btn('ghost')}>Open Attendance</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        <ClickCard
          label="Students In Class"
          value={(inClassroomsStudents || []).length}
          color="#4f6687"
          sub="currently present in classrooms"
          onClick={() => setDrillDown({ title: 'In Class', students: inClassroomsStudents || [] })}
        />
        <ClickCard
          label="Late Today"
          value={(lateStudents || []).length}
          color="#9a6a2a"
          sub="arrived after start time"
          onClick={() => setDrillDown({ title: 'Late', students: lateStudents || [] })}
        />
        <ClickCard
          label="Absent Today"
          value={(absentTodayStudents || []).length}
          color="#9f1239"
          sub="not marked present"
          onClick={() => setDrillDown({ title: 'Absent', students: absentTodayStudents || [] })}
        />
        <ClickCard
          label="Unknown Location"
          value={unknown || 0}
          color="#7c3aed"
          sub="need office follow-up"
          onClick={() => setPage('attendance')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 18 }}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#172033' }}>Office Work Queue</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Highest-priority daily operations tasks.</div>
            </div>
          </div>

          {[
            {
              title: 'Parent calls due',
              count: (callsDueStudents || []).length,
              note: 'students needing parent contact',
              page: 'calls',
            },
            {
              title: 'Unknown student locations',
              count: unknown || 0,
              note: 'resolve via attendance board',
              page: 'attendance',
            },
            {
              title: 'Urgent alerts',
              count: (urgentStudents || []).length,
              note: 'students flagged for immediate attention',
              page: 'alerts',
            },
            {
              title: 'Store low-stock review',
              count: lowStockCount,
              note: 'canteen items below threshold',
              page: 'store',
            },
          ].map(item => (
            <div
              key={item.title}
              onClick={() => setPage(item.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 14px',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#fff',
                marginBottom: 9,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: '#172033',
                }}
              >
                {item.count}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.note}</div>
              </div>
              <div style={{ fontSize: 18, color: '#94a3b8' }}>›</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 4 }}>Attendance Exceptions</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Students needing attendance desk action.</div>

          {leftEarlyStudents?.slice(0, 6).map((student: any) => (
            <div
              key={`left-${student.id}`}
              onClick={() => openStudent(student, 'attendance')}
              style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{student.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>left early</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{student.className || 'Class not set'}</div>
            </div>
          ))}

          {(!leftEarlyStudents || leftEarlyStudents.length === 0) && (
            <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', color: '#64748b', fontSize: 13 }}>
              No left-early exceptions right now.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Parent Calls Due</div>
          {callsDue.map((student: any) => (
            <div
              key={student.id}
              onClick={() => openStudent(student, 'calls')}
              style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{student.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                {student.className} · parent call follow-up needed
              </div>
            </div>
          ))}
          {callsDue.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>No parent calls due right now.</div>}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Urgent Student Alerts</div>
          {(urgentStudents || []).slice(0, 6).map((student: any) => (
            <div
              key={`urgent-${student.id}`}
              onClick={() => openStudent(student, 'support')}
              style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{student.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                {student.className || 'Class not set'} · marked urgent
              </div>
            </div>
          ))}
          {(!urgentStudents || urgentStudents.length === 0) && (
            <div style={{ fontSize: 13, color: '#64748b' }}>No urgent student alerts right now.</div>
          )}
        </div>
      </div>
    </div>
  )
}
