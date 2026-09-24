import type { Dispatch, SetStateAction } from 'react'
import type { StudentLike } from './dashboardHelpers'

export default function UnknownLocationsModal({
  students,
  unknownNotes,
  setUnknownNotes,
  onClose,
  updateUnknownLocation,
  S,
  initials,
}: {
  students: StudentLike[]
  unknownNotes: Record<string, string>
  setUnknownNotes: Dispatch<SetStateAction<Record<string, string>>>
  onClose: () => void
  updateUnknownLocation: (studentId: number | string, newStatus: string, label: string) => void
  S: Record<string, any>
  initials: (name: string) => string
}) {
  const unknownStudents = students.filter(student => student.status === 'unknown')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '84vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(15,23,42,0.28)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #eef0f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#263241' }}>Update Unknown Locations</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Mark each located boy and add an optional note.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f4f5f8', color: '#263241', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
        <div style={{ padding: 18, overflow: 'auto', maxHeight: '68vh' }}>
          {unknownStudents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No unknown locations right now.</div>
          )}
          {unknownStudents.map((student, index) => (
            <div key={student.id} style={{ border: '1px solid #eef0f7', borderRadius: 12, padding: 16, marginBottom: 12, background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={S.avatar(index, 36)}>{initials(student.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#263241' }}>{student.name}</div>
                  <div style={{ fontSize: 12, color: '#9f1239', marginTop: 2 }}>Location unknown</div>
                </div>
              </div>
              <input value={unknownNotes[student.id] || ''} onChange={event => setUnknownNotes(prev => ({ ...prev, [student.id]: event.target.value }))} placeholder="Optional note, for example: found by office with Rabbi Baum" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e1e7ef', borderRadius: 10, fontSize: 13, marginBottom: 12, outline: 'none' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button onClick={() => updateUnknownLocation(student.id, 'present', 'In Classroom')} style={S.btn('primary')}>Mark In Classroom</button>
                <button onClick={() => updateUnknownLocation(student.id, 'therapy', 'Therapy')} style={S.btn('purple')}>Mark Therapy</button>
                <button onClick={() => updateUnknownLocation(student.id, 'with-bt', 'With BT')} style={{ ...S.btn('ghost'), color: '#0369a1' }}>Mark With BT</button>
                <button onClick={() => updateUnknownLocation(student.id, 'absent', 'Absent')} style={{ ...S.btn('ghost'), color: '#9f1239' }}>Mark Absent</button>
                <button onClick={() => updateUnknownLocation(student.id, 'left-early', 'Left Early')} style={{ ...S.btn('ghost'), color: '#64748b' }}>Mark Left Early</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}