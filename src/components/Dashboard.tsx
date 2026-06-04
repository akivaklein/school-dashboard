import { useState } from 'react'

// ─── DATA ───────────────────────────────────────────────────────────────────

const BEHAVIORS_POSITIVE = [
  { id: 'p1', label: 'Appropriate appearance', points: 1 },
  { id: 'p2', label: 'On-time to class', points: 2 },
  { id: 'p3', label: 'Ignored peer misbehavior', points: 2 },
  { id: 'p4', label: 'Major appropriate behavior', points: 3 },
  { id: 'p5', label: 'Completed homework', points: 2 },
  { id: 'p6', label: 'Helped a classmate', points: 2 },
]

const BEHAVIORS_NEGATIVE = [
  { id: 'n1', label: 'Speaking without permission', points: -1 },
  { id: 'n2', label: 'Off-task behavior', points: -1 },
  { id: 'n3', label: 'Noncompliance', points: -1 },
  { id: 'n4', label: 'Disruptive behavior', points: -1 },
  { id: 'n5', label: 'Disrespect', points: -2 },
  { id: 'n6', label: 'Physical aggression', points: -3 },
]

const STORE_ITEMS = [
  { id: 1, name: 'Extra Recess', cost: 50, emoji: '⚽' },
  { id: 2, name: 'Sit with Friend', cost: 30, emoji: '🪑' },
  { id: 3, name: 'No Homework Pass', cost: 100, emoji: '📝' },
  { id: 4, name: 'Choose Class Game', cost: 75, emoji: '🎮' },
  { id: 5, name: 'Homework Helper', cost: 40, emoji: '✏️' },
  { id: 6, name: 'Free Reading Time', cost: 25, emoji: '📚' },
]

const THERAPISTS = [
  { id: 't1', name: 'Mrs. Goldberg', specialty: 'Speech Therapy' },
  { id: 't2', name: 'Mr. Weinstein', specialty: 'OT' },
  { id: 't3', name: 'Mrs. Friedman', specialty: 'Counseling' },
]

const initialStudents = [
  { id: 1, name: 'Bloom Yair', points: 45, redMarks: 2, att: ['P','P','L','L','L'], breakfast: ['Y','Y','N','N','N'], detention: true, status: 'present', services: [{ therapistId: 't1', type: 'Speech Therapy', hrs: 1.5 }], parentCalls: [{ date: '2025-05-28', staff: 'Rabbi Klein', notes: 'Discussed attendance issues', duration: '8 min' }], notes: [{ date: '2025-05-30', author: 'Rabbi Klein', text: 'Improving in morning davening.' }], behaviorLog: [], iep: true, iepDetails: 'Speech IEP - annual review due Aug 2025' },
  { id: 2, name: 'Friedlander Zev', points: 80, redMarks: 0, att: ['A','A','P','P','P'], breakfast: ['Y','Y','Y','Y','Y'], detention: false, status: 'present', services: [], parentCalls: [], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 3, name: 'Haddad Moshe Chaim', points: 60, redMarks: 3, att: ['P','L','A','P','P'], breakfast: ['N','N','N','Y','Y'], detention: false, status: 'therapy', services: [{ therapistId: 't3', type: 'Counseling', hrs: 3 }], parentCalls: [{ date: '2025-06-01', staff: 'Mrs. Cohen', notes: 'Left voicemail', duration: '2 min' }], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 4, name: 'Hayon David', points: 95, redMarks: 0, att: ['P','P','P','P','P'], breakfast: ['Y','Y','Y','Y','Y'], detention: false, status: 'present', services: [], parentCalls: [], notes: [{ date: '2025-06-02', author: 'Rabbi Klein', text: 'Excellent week overall.' }], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 5, name: 'Karman Yitzchok', points: 20, redMarks: 5, att: ['A','A','A','P','P'], breakfast: ['N','N','N','N','Y'], detention: false, status: 'absent', services: [], parentCalls: [], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 6, name: 'Levitz Avrohom', points: 70, redMarks: 1, att: ['P','P','P','L','P'], breakfast: ['Y','N','N','N','Y'], detention: false, status: 'hallway', services: [{ therapistId: 't2', type: 'OT', hrs: 2 }], parentCalls: [{ date: '2025-05-20', staff: 'Rabbi Klein', notes: 'General check-in', duration: '5 min' }], notes: [], behaviorLog: [], iep: true, iepDetails: 'OT IEP - sensory processing' },
  { id: 7, name: 'Rosenfeld Yehuda', points: 55, redMarks: 6, att: ['P','P','P','P','A'], breakfast: ['Y','Y','Y','Y','Y'], detention: true, status: 'late', services: [], parentCalls: [], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 8, name: 'Schwartz Moishe Michael', points: 40, redMarks: 2, att: ['L','L','L','L','P'], breakfast: ['Y','Y','Y','N','N'], detention: false, status: 'present', services: [{ therapistId: 't3', type: 'Counseling', hrs: 0.5 }], parentCalls: [], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
  { id: 9, name: 'Simon Eliyahu', points: 65, redMarks: 1, att: ['P','P','P','P','P'], breakfast: ['Y','Y','Y','Y','N'], detention: false, status: 'not-arrived', services: [], parentCalls: [], notes: [], behaviorLog: [], iep: false, iepDetails: '' },
]

const statusColor = { present: '#16a34a', absent: '#dc2626', late: '#d97706', therapy: '#7c3aed', hallway: '#0891b2', 'not-arrived': '#6b7280' }
const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', therapy: 'In Therapy', hallway: 'In Hallway', 'not-arrived': 'Not Arrived' }
const statusEmoji = { present: '✅', absent: '❌', late: '⏰', therapy: '🧠', hallway: '🚶', 'not-arrived': '❓' }

function daysSince(dateStr) {
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000)
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const AVATAR_COLORS = ['#3b5998','#e74c3c','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c']

const S = {
  app: { fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: '#f0f2f5', color: '#111' },
  sidebar: { width: 220, background: '#1e2a4a', color: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 },
  sidebarItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderRadius: 8, margin: '2px 8px', background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: active ? 600 : 400 }),
  main: { marginLeft: 220, padding: '24px', minHeight: '100vh' },
  card: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  statCard: (color) => ({ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }),
  badge: (color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg }),
  btn: (variant) => {
    const map = { primary: ['#1e2a4a','#fff'], danger: ['#dc2626','#fff'], ghost: ['#f3f4f6','#374151'], success: ['#16a34a','#fff'], purple: ['#7c3aed','#fff'] }
    return { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1] }
  },
  tag: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: color + '18', color }),
  avatar: (idx, size = 38) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 14 : 11, flexShrink: 0 }),
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [role, setRole] = useState('admin')
  const accounts = { admin: { name: 'Rabbi Klein', email: 'aklein@hadranacademy.org' }, teacher: { name: 'Reb Goldstein', email: 'teacher@hadranacademy.org' }, therapist: { name: 'Mrs. Goldberg', email: 'therapist@hadranacademy.org' } }
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e2a4a 0%, #2d4080 50%, #1a3a6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', borderRadius: 24, overflow: 'hidden', width: 820, display: 'flex', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ flex: 1, padding: '52px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 20 }}>🎓</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>Hadran<br/>Academy</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 10, textAlign: 'center' }}>Empowering education through<br/>advanced learning solutions</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 36 }}>
            {[['📖','Learning'],['🏆','Excellence'],['🔒','Security']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 6px' }}>{icon}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Welcome Back</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 28 }}>Sign in to your account</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>Sign in as</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['admin','Admin'],['teacher','Teacher'],['therapist','Therapist']].map(([r, label]) => (
                <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid ' + (role === r ? '#60a5fa' : 'rgba(255,255,255,0.2)'), background: role === r ? 'rgba(96,165,250,0.2)' : 'transparent', color: role === r ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>Email</div>
            <input value={accounts[role].email} readOnly style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>Password</div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => onLogin(role, accounts[role].name)} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sign In →</button>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Need help? Contact admin@hadranacademy.org</div>
        </div>
      </div>
    </div>
  )
}

// ─── STUDENT PROFILE MODAL ───────────────────────────────────────────────────
function StudentProfile({ student, students, setStudents, onClose, role }) {
  const [tab, setTab] = useState('overview')
  const [noteText, setNoteText] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [callStaff, setCallStaff] = useState('Rabbi Klein')
  const [callDuration, setCallDuration] = useState('')
  const s = students.find(x => x.id === student.id)

  function addNote() {
    if (!noteText.trim()) return
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, notes: [...x.notes, { date: new Date().toISOString().slice(0,10), author: callStaff, text: noteText }] } : x))
    setNoteText('')
  }
  function addCall() {
    if (!callNotes.trim()) return
    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentCalls: [...x.parentCalls, { date: new Date().toISOString().slice(0,10), staff: callStaff, notes: callNotes, duration: callDuration }] } : x))
    setCallNotes(''); setCallDuration('')
  }

  const absCount = s.att.filter(d => d === 'A').length
  const lateCount = s.att.filter(d => d === 'L').length
  const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 780, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#1e2a4a', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={S.avatar(s.id - 1, 52)}>{initials(s.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ ...S.tag(statusColor[s.status]), fontSize: 12 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
              {s.iep && <span style={{ background: '#7c3aed18', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>📋 IEP</span>}
              {s.detention && <span style={{ background: '#dc262618', color: '#dc2626', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>⚠️ Detention</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, color: '#fff', textAlign: 'center' }}>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>{s.points}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Points</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: s.redMarks >= 6 ? '#f87171' : '#fff' }}>{s.redMarks}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Red Marks</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>{absCount}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Absences</div></div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          {['overview','attendance','behavior','therapy','calls','notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '2px solid #1e2a4a' : '2px solid transparent', color: tab === t ? '#1e2a4a' : '#6b7280', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>📊 This Week</div>
                {[['Present days', s.att.filter(d=>d==='P').length+'/5', '#111'],['Late arrivals', lateCount, '#d97706'],['Absences', absCount, '#dc2626'],['Points', s.points+' pts', '#d97706'],['Red marks', s.redMarks, s.redMarks>=4?'#dc2626':'#111'],['Last parent call', lastCall ? daysSince(lastCall.date)+'d ago' : 'Never', '#111']].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f9fafb', fontSize: 14 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span><span style={{ fontWeight: 600, color }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>📅 Attendance</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Mon','Tue','Wed','Thu','Fri'].map((day, i) => (
                    <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{day}</div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe', color: s.att[i]==='P'?'#16a34a':s.att[i]==='A'?'#dc2626':'#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, margin: '0 auto' }}>{s.att[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              {s.iep && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '4px solid #7c3aed' }}><div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>📋 IEP</div><div style={{ fontSize: 14 }}>{s.iepDetails}</div></div>}
              {s.services.length > 0 && (
                <div style={{ ...S.card, gridColumn: 'span 2' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>🧠 Therapy Services</div>
                  {s.services.map((svc, i) => {
                    const therapist = THERAPISTS.find(t => t.id === svc.therapistId)
                    return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}><span style={{ fontWeight: 600 }}>{svc.type}</span><span style={{ color: '#6b7280' }}>with {therapist?.name}</span><span style={{ color: '#7c3aed', fontWeight: 600 }}>{svc.hrs} hrs/week</span></div>
                  })}
                </div>
              )}
            </div>
          )}
          {tab === 'attendance' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>📅 Attendance Record</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: 10 }}>Day</th><th style={{ padding: 10, textAlign: 'center' }}>Status</th><th style={{ padding: 10, textAlign: 'center' }}>Breakfast</th></tr></thead>
                <tbody>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday'].map((day, i) => (
                    <tr key={day} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: 10 }}>{day}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.att[i]==='P'?'#16a34a':s.att[i]==='A'?'#dc2626':'#2563eb', s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe')}>{s.att[i]==='P'?'Present':s.att[i]==='A'?'Absent':'Late'}</span></td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.breakfast[i]==='Y'?'#16a34a':'#dc2626', s.breakfast[i]==='Y'?'#dcfce7':'#fee2e2')}>{s.breakfast[i]==='Y'?'✓ Had breakfast':'✗ Skipped'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ ...S.statCard('#d97706'), flex: 1 }}><div style={{ fontSize: 12, color: '#6b7280' }}>Points</div><div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{s.points}</div></div>
                <div style={{ ...S.statCard('#dc2626'), flex: 1 }}><div style={{ fontSize: 12, color: '#6b7280' }}>Red Marks</div><div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{s.redMarks}</div></div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent Behavior Log</div>
                {s.behaviorLog.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 14 }}>No behavior events yet.</div> : s.behaviorLog.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                    <span>{b.label}</span><span style={{ fontWeight: 700, color: b.points > 0 ? '#16a34a' : '#dc2626' }}>{b.points > 0 ? '+' : ''}{b.points}</span><span style={{ color: '#9ca3af' }}>{b.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'therapy' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>🧠 Therapy & Services</div>
              {s.services.length === 0 ? <div style={{ color: '#9ca3af' }}>No therapy services assigned.</div> : s.services.map((svc, i) => {
                const therapist = THERAPISTS.find(t => t.id === svc.therapistId)
                return <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{svc.type}</div><div style={{ color: '#6b7280', fontSize: 14 }}>Therapist: <strong>{therapist?.name}</strong></div><div style={{ color: '#7c3aed', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{svc.hrs} hours/week</div></div>
              })}
            </div>
          )}
          {tab === 'calls' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>📞 Parent Call Log</div>
              {s.parentCalls.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>No calls recorded yet.</div> : s.parentCalls.map((c, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{c.staff}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{c.date} · {c.duration}</span></div>
                  <div style={{ fontSize: 14, color: '#374151' }}>{c.notes}</div>
                </div>
              ))}
              {role !== 'therapist' && (
                <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Log a new call</div>
                  <input placeholder="Staff name" value={callStaff} onChange={e => setCallStaff(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  <input placeholder="Duration (e.g. 5 min)" value={callDuration} onChange={e => setCallDuration(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  <textarea placeholder="Call notes..." value={callNotes} onChange={e => setCallNotes(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 14, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                  <button onClick={addCall} style={S.btn('primary')}>Log Call</button>
                </div>
              )}
            </div>
          )}
          {tab === 'notes' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>📝 Staff Notes</div>
              {s.notes.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>No notes yet.</div> : s.notes.map((n, i) => (
                <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{n.author}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{n.date}</span></div>
                  <div style={{ fontSize: 14, color: '#374151' }}>{n.text}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 14, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                <button onClick={addNote} style={S.btn('primary')}>Add Note</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('admin')
  const [userName, setUserName] = useState('')
  const [page, setPage] = useState('dashboard')
  const [students, setStudents] = useState(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [storeStudent, setStoreStudent] = useState(null)
  const [behaviorStudent, setBehaviorStudent] = useState(null)
  const [behaviorTab, setBehaviorTab] = useState('positive')
  const [attFilter, setAttFilter] = useState('all')

  function handleLogin(r, name) { setRole(r); setUserName(name); setLoggedIn(true); setPage('dashboard') }
  function updateStatus(id, status) { setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s)) }
  function addPoints(id, amount) { setStudents(prev => prev.map(s => s.id === id ? { ...s, points: Math.max(0, s.points + amount) } : s)) }
  function addRedMark(id) { setStudents(prev => prev.map(s => s.id === id ? { ...s, redMarks: s.redMarks + 1 } : s)) }
  function applyBehavior(studentId, beh) {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      return { ...s, points: Math.max(0, s.points + beh.points), redMarks: beh.points < 0 ? s.redMarks + 1 : s.redMarks, behaviorLog: [{ label: beh.label, points: beh.points, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) }
    }))
  }
  function buyItem(studentId, cost, itemName) {
    const s = students.find(x => x.id === studentId)
    if (!s || s.points < cost) { alert('Not enough points!'); return }
    setStudents(prev => prev.map(x => x.id === studentId ? { ...x, points: x.points - cost } : x))
    alert(`${s.name} redeemed: ${itemName}!`)
  }

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />

  const present = students.filter(s => s.status === 'present').length
  const absent = students.filter(s => s.status === 'absent').length
  const late = students.filter(s => s.status === 'late').length
  const inTherapy = students.filter(s => s.status === 'therapy').length
  const inHallway = students.filter(s => s.status === 'hallway').length
  const notArrived = students.filter(s => s.status === 'not-arrived').length

  const alerts = students.flatMap(s => {
    const a = []
    const absCount = s.att.filter(d => d === 'A').length
    const lateCount = s.att.filter(d => d === 'L').length
    const skipBreakfast = s.breakfast.filter(d => d === 'N').length
    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
    if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
    if (s.redMarks >= 6) a.push({ student: s.name, id: s.id, msg: '🔴 6 red marks — consequence required!', type: 'danger' })
    if (s.redMarks >= 4 && s.redMarks < 6) a.push({ student: s.name, id: s.id, msg: `⚠️ ${s.redMarks} red marks this week`, type: 'warn' })
    if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: `Absent ${absCount} days this week`, type: absCount >= 3 ? 'danger' : 'warn' })
    if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: `Late ${lateCount} days this week`, type: 'warn' })
    if (skipBreakfast >= 3) a.push({ student: s.name, id: s.id, msg: `Skipped breakfast ${skipBreakfast} days`, type: 'warn' })
    if (!lastCall || daysSince(lastCall.date) > 14) a.push({ student: s.name, id: s.id, msg: lastCall ? `No parent call in ${daysSince(lastCall.date)} days` : 'Parent never called', type: 'info' })
    return a
  })

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'students', label: role === 'admin' ? 'All Students' : 'My Students', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍️' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
    ...(role === 'admin' ? [{ id: 'calls', label: 'Parent Calls', icon: '📞' }] : []),
  ]

  const filteredStudents = attFilter === 'all' ? students : students.filter(s => s.status === attFilter)

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>🎓 Hadran Academy</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Dargei Beis · {role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Therapist'}</div>
        </div>
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} style={S.sidebarItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{userName}</div>
          <button onClick={() => setLoggedIn(false)} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Logout</button>
        </div>
      </div>

      <div style={S.main}>

        {page === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>Dargei Beis · Week of Jun 2, 2025 · 9 students</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
              {[['Present', present, '#16a34a'],['Absent', absent, '#dc2626'],['Late', late, '#d97706'],['In Therapy', inTherapy, '#7c3aed'],['In Hallway', inHallway, '#0891b2'],['Not Arrived', notArrived, '#6b7280']].map(([label, val, color]) => (
                <div key={label} style={S.statCard(color)}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ ...S.card, gridColumn: 'span 2' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>👥 Student Status — Live</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {students.map((s, i) => {
                    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                    const needsCall = !lastCall || daysSince(lastCall.date) > 14
                    return (
                      <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={S.avatar(i)}>{initials(s.name)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                            <span style={{ ...S.tag(statusColor[s.status]), fontSize: 11 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={S.badge('#d97706', '#fef9c3')}>{s.points} pts</span>
                          {s.redMarks >= 4 && <span style={S.badge('#dc2626', '#fee2e2')}>🔴 {s.redMarks}</span>}
                          {s.detention && <span style={S.badge('#dc2626', '#fee2e2')}>Det.</span>}
                          {needsCall && <span style={S.badge('#d97706', '#fffbeb')}>📞?</span>}
                          {s.iep && <span style={S.badge('#7c3aed', '#f5f3ff')}>IEP</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🔔 Top Alerts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflow: 'auto' }}>
                  {alerts.slice(0, 6).map((a, i) => (
                    <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) setSelectedStudent(s) }} style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'danger' ? '#fca5a5' : a.type === 'warn' ? '#fcd34d' : '#bfdbfe'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.student}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{a.msg}</div>
                    </div>
                  ))}
                  {alerts.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>All clear! ✅</div>}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📞 Parent Calls Needed</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflow: 'auto' }}>
                  {students.map((s, i) => {
                    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                    const days = lastCall ? daysSince(lastCall.date) : 999
                    if (days <= 14) return null
                    return (
                      <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                        <div style={S.avatar(i, 32)}>{initials(s.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: '#9a3412' }}>{lastCall ? `Last called ${days} days ago` : 'Never called'}</div>
                        </div>
                        <span style={S.badge('#d97706', '#fff7ed')}>📞 Call</span>
                      </div>
                    )
                  }).filter(Boolean)}
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'students' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>👥 {role === 'admin' ? 'All Students' : 'My Students'}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                return (
                  <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <div style={S.avatar(i, 44)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                        {s.iep && <span style={S.tag('#7c3aed')}>📋 IEP</span>}
                        {s.detention && <span style={S.tag('#dc2626')}>⚠️ Detention</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>pts</div></div>
                      <div><div style={{ fontSize: 18, fontWeight: 800, color: s.redMarks >= 4 ? '#dc2626' : '#374151' }}>{s.redMarks}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>red marks</div></div>
                      <div><div style={{ fontSize: 18, fontWeight: 800 }}>{s.att.filter(d => d==='A').length}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>absences</div></div>
                      <div><div style={{ fontSize: 14, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d ago` : 'Never'}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>last call</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {page === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📅 Attendance</h1>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all',...Object.keys(statusLabel)].map(f => (
                  <button key={f} onClick={() => setAttFilter(f)} style={{ ...S.btn(attFilter === f ? 'primary' : 'ghost'), padding: '6px 10px', fontSize: 12 }}>{f === 'all' ? 'All' : (statusEmoji[f]||'') + ' ' + (statusLabel[f]||f)}</button>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                    {['Mon','Tue','Wed','Thu','Fri'].map(d => <th key={d} style={{ padding: 10, textAlign: 'center' }}>{d}</th>)}
                    <th style={{ padding: 10, textAlign: 'center' }}>P</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>A</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>L</th>
                    {role !== 'therapist' && <th style={{ padding: 10, textAlign: 'center' }}>Update</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                          <span style={{ fontWeight: 500 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span></td>
                      {s.att.map((d, j) => (
                        <td key={j} style={{ padding: 10, textAlign: 'center' }}>
                          <span style={{ background: d==='P'?'#dcfce7':d==='A'?'#fee2e2':'#dbeafe', color: d==='P'?'#16a34a':d==='A'?'#dc2626':'#2563eb', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{d}</span>
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', padding: 10 }}>{s.att.filter(d=>d==='P').length}</td>
                      <td style={{ textAlign: 'center', padding: 10, color: '#dc2626', fontWeight: 600 }}>{s.att.filter(d=>d==='A').length}</td>
                      <td style={{ textAlign: 'center', padding: 10, color: '#d97706', fontWeight: 600 }}>{s.att.filter(d=>d==='L').length}</td>
                      {role !== 'therapist' && (
                        <td style={{ padding: '6px 10px' }}>
                          <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer' }}>
                            {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {page === 'behavior' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>⭐ Behavior & Points</h1>
            {behaviorStudent ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button onClick={() => setBehaviorStudent(null)} style={S.btn('ghost')}>← Back</button>
                  <div style={S.avatar(behaviorStudent.id - 1, 40)}>{initials(behaviorStudent.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{behaviorStudent.name}</div>
                    <div style={{ color: '#d97706', fontWeight: 700 }}>{students.find(s => s.id === behaviorStudent.id)?.points} pts · {students.find(s => s.id === behaviorStudent.id)?.redMarks} red marks</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setBehaviorTab('positive')} style={S.btn(behaviorTab === 'positive' ? 'success' : 'ghost')}>✅ Positive</button>
                  <button onClick={() => setBehaviorTab('negative')} style={S.btn(behaviorTab === 'negative' ? 'danger' : 'ghost')}>❌ Deductions</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {(behaviorTab === 'positive' ? BEHAVIORS_POSITIVE : BEHAVIORS_NEGATIVE).map(beh => (
                    <button key={beh.id} onClick={() => applyBehavior(behaviorStudent.id, beh)} style={{ background: behaviorTab === 'positive' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${behaviorTab === 'positive' ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{beh.label}</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: behaviorTab === 'positive' ? '#16a34a' : '#dc2626' }}>{beh.points > 0 ? '+' : ''}{beh.points}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button onClick={() => addPoints(behaviorStudent.id, 10)} style={S.btn('success')}>+10 Points</button>
                  <button onClick={() => addPoints(behaviorStudent.id, -10)} style={S.btn('danger')}>-10 Points</button>
                  <button onClick={() => addRedMark(behaviorStudent.id)} style={{ ...S.btn('danger'), background: '#7f1d1d' }}>🔴 Red Mark</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[...students].sort((a, b) => b.points - a.points).map((s, i) => (
                  <div key={s.id} onClick={() => setBehaviorStudent(s)} style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={S.avatar(s.id - 1, 42)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <span style={S.badge('#d97706', '#fef9c3')}>{s.points} pts</span>
                        {s.redMarks > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>🔴 {s.redMarks}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'store' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🛍️ Token Store</h1>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Select a student:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {students.map(s => (
                  <button key={s.id} onClick={() => setStoreStudent(s.id)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${storeStudent === s.id ? '#1e2a4a' : '#e5e7eb'}`, cursor: 'pointer', fontSize: 13, fontWeight: storeStudent === s.id ? 700 : 400, background: storeStudent === s.id ? '#1e2a4a' : '#fff', color: storeStudent === s.id ? '#fff' : '#111' }}>
                    {s.name} · <span style={{ color: storeStudent === s.id ? '#fbbf24' : '#d97706' }}>{s.points} pts</span>
                  </button>
                ))}
              </div>
            </div>
            {storeStudent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {STORE_ITEMS.map(item => {
                  const s = students.find(x => x.id === storeStudent)
                  const canAfford = s && s.points >= item.cost
                  return (
                    <div key={item.id} style={{ ...S.card, textAlign: 'center', opacity: canAfford ? 1 : 0.6 }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>{item.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ color: '#d97706', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>{item.cost} pts</div>
                      <button onClick={() => buyItem(storeStudent, item.cost, item.name)} style={{ ...S.btn(canAfford ? 'success' : 'ghost'), width: '100%', cursor: canAfford ? 'pointer' : 'not-allowed' }}>{canAfford ? '🎉 Redeem' : 'Not enough'}</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {page === 'alerts' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🔔 All Alerts ({alerts.length})</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No alerts! Everything looks great ✅</div>}
              {alerts.map((a, i) => (
                <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) setSelectedStudent(s) }} style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'danger' ? '#fca5a5' : a.type === 'warn' ? '#fcd34d' : '#bfdbfe'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div><div style={{ fontWeight: 700, fontSize: 14 }}>{a.student}</div><div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{a.msg}</div></div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>View profile →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'calls' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>📞 Parent Call Log</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {students.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                const days = lastCall ? daysSince(lastCall.date) : 999
                return (
                  <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ ...S.card, cursor: 'pointer', borderLeft: `4px solid ${days > 14 ? '#f97316' : '#16a34a'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={S.avatar(i, 36)}>{initials(s.name)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: days > 14 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>{lastCall ? `Last call: ${days} days ago` : '⚠️ Never called'}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{s.parentCalls.length} calls</div>
                    </div>
                    {lastCall && <div style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', borderRadius: 8, padding: '8px 10px' }}>"{lastCall.notes}"</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {selectedStudent && (
        <StudentProfile student={selectedStudent} students={students} setStudents={setStudents} onClose={() => setSelectedStudent(null)} role={role} />
      )}
    </div>
  )
}
