import { getDailyAttendanceStatus, getCurrentLocationStatus } from '../../utils/attendancePresence'
import { statusLabel } from '../dashboardData'
import { S, initials, getImprovement, type StudentLike, type StaffMemberLike } from './dashboardHelpers'

export function TherapistDashboard({ students, userName, setSelectedStudent, staffMembers, therapySchedule }: { students: StudentLike[]; userName: string | null; setSelectedStudent: (student: StudentLike) => void; staffMembers: StaffMemberLike[]; therapySchedule: Array<{ day?: string; student?: string; type?: string; duration?: string; time?: string; staffId?: number | string }> }) {
  const myStudents = students.filter((s: StudentLike) => Array.isArray((s as StudentLike).services) && (s as StudentLike).services.length > 0)
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>Therapist Portal · Wednesday, June 4</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 My Students</div>
          {myStudents.map((s: StudentLike, i: number) => {
            const imp = getImprovement(s as { lastWeekReminders: number; reminders: number })
            const studentName = typeof s.name === 'string' ? s.name : 'Student'
            const locationStatus = getCurrentLocationStatus(s)
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div style={S.avatar(i, 36)}>{initials(studentName)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{studentName}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={S.tag('#536579', '#eef2f6')}>Daily: {getDailyAttendanceStatus(s)}</span>
                    <span style={S.tag('#536579', '#f4f6f8')}>Location: {locationStatus === 'not-confirmed' ? 'Not confirmed' : locationStatus === 'present' ? 'In Class' : statusLabel[locationStatus] || locationStatus}</span>
                    <span style={{ fontSize: 11, color: imp.color, fontWeight: 600 }}>{imp.icon}</span>
                  </div>
                </div>
                <div>{(Array.isArray((s as StudentLike).services) ? (s as StudentLike).services : []).map((svc: { type?: string }, j: number) => <div key={j} style={{ fontSize: 11, color: '#5b5f7a', fontWeight: 600 }}>{svc.type}</div>)}</div>
              </div>
            )
          })}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 This Week's Sessions</div>
          {therapySchedule.map((t: { day?: string; student?: string; type?: string; duration?: string; time?: string; staffId?: number | string }, i: number) => {
            const staffMember = staffMembers.find((st: StaffMemberLike) => st.id === t.staffId)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#5b5f7a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{t.type} · {t.duration}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t.time}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
