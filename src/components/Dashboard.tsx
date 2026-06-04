import { useState } from 'react'

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    if (type === 'positive') { o.frequency.setValueAtTime(520, ctx.currentTime); o.frequency.setValueAtTime(800, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); o.start(); o.stop(ctx.currentTime + 0.4) }
    else if (type === 'negative') { o.frequency.setValueAtTime(300, ctx.currentTime); o.frequency.setValueAtTime(200, ctx.currentTime + 0.15); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o.start(); o.stop(ctx.currentTime + 0.3) }
    else if (type === 'redmark') { o.frequency.setValueAtTime(200, ctx.currentTime); o.frequency.setValueAtTime(150, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.4, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.start(); o.stop(ctx.currentTime + 0.5) }
    else if (type === 'store') { o.frequency.setValueAtTime(600, ctx.currentTime); o.frequency.setValueAtTime(1000, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.start(); o.stop(ctx.currentTime + 0.5) }
  } catch(e) {}
}

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
  { id: 7, name: 'Kosher Soda', cost: 20, emoji: '🥤' },
  { id: 8, name: 'Kosher Juice', cost: 15, emoji: '🧃' },
  { id: 9, name: 'Kosher Water', cost: 10, emoji: '💧' },
  { id: 10, name: 'Kosher Snack', cost: 35, emoji: '🍪' },
]
const STAFF = [
  { id: 's1', name: 'Rabbi Baum', role: 'Menahel' },
  { id: 's2', name: 'Rabbi Ehrnreich', role: 'Sgan Menahel' },
  { id: 's3', name: 'Rabbi Hillel', role: 'Mashgiach' },
  { id: 's4', name: 'Rabbi Klein', role: 'Teacher' },
  { id: 's5', name: 'Rabbi Goldstein', role: 'Teacher' },
  { id: 's6', name: 'Mrs. Goldberg', role: 'Speech Therapist' },
  { id: 's7', name: 'Mr. Weinstein', role: 'OT' },
  { id: 's8', name: 'Mrs. Friedman', role: 'Counselor' },
  { id: 's9', name: 'Yitzi Liebowitz', role: 'Therapist' },
  { id: 's10', name: 'Ezriel', role: 'BT' },
  { id: 's11', name: 'Dovid', role: 'BT' },
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const SCHEDULE = [
  { period: 1, time: '8:00 - 9:00', subject: 'Shacharis', teacher: 'Rabbi Hillel', room: 'Beis Medrash' },
  { period: 2, time: '9:00 - 10:00', subject: 'Gemara Shiur', teacher: 'Rabbi Klein', room: 'Room 101' },
  { period: 3, time: '10:00 - 11:00', subject: 'Halacha', teacher: 'Rabbi Goldstein', room: 'Room 102' },
  { period: 4, time: '11:00 - 11:15', subject: 'Break', teacher: '', room: '' },
  { period: 5, time: '11:15 - 12:15', subject: 'Chumash', teacher: 'Rabbi Klein', room: 'Room 101' },
  { period: 6, time: '12:15 - 1:00', subject: 'Lunch', teacher: '', room: 'Cafeteria' },
  { period: 7, time: '1:00 - 2:00', subject: 'English', teacher: 'Mr. Cohen', room: 'Room 103' },
  { period: 8, time: '2:00 - 3:00', subject: 'Math', teacher: 'Mr. Cohen', room: 'Room 103' },
  { period: 9, time: '3:00 - 4:00', subject: 'Mincha / Review', teacher: 'Rabbi Hillel', room: 'Beis Medrash' },
]
const THERAPY_SCHEDULE = [
  { student: 'Bloom Yair', staffId: 's6', day: 'Mon', time: '10:00', duration: '45 min', type: 'Speech' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:00', duration: '60 min', type: 'Counseling' },
  { student: 'Levitz Avrohom', staffId: 's7', day: 'Wed', time: '9:30', duration: '45 min', type: 'OT' },
  { student: 'Feltman Daniel', staffId: 's9', day: 'Thu', time: '10:00', duration: '45 min', type: 'Therapy' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Fri', time: '11:30', duration: '30 min', type: 'Counseling' },
]

const mkStudent = (id, name, points, reminders, att, status, withStaff = null, services = [], parentCalls = [], notes = [], iep = false, iepDetails = '', detention = false) => ({
  id, name, points, reminders, lastWeekReminders: reminders + Math.floor(Math.random() * 3),
  att, breakfast: att.map(() => Math.random() > 0.3 ? 'Y' : 'N'),
  detention, status, withStaff, services, parentCalls, notes, behaviorLog: [], iep, iepDetails
})

const initialStudents = [
  mkStudent(1, 'Bloom Yair', 45, 2, ['P','P','L','L','L','P'], 'present', null, [{staffId:'s6',type:'Speech Therapy',hrs:1.5}], [{date:'2025-05-28',staff:'Rabbi Klein',notes:'Discussed attendance',duration:'8 min'}], [{date:'2025-05-30',author:'Rabbi Klein',text:'Improving in davening.'}], true, 'Speech IEP - review Aug 2025', true),
  mkStudent(2, 'Friedlander Zev', 80, 0, ['A','A','P','P','P','P'], 'present'),
  mkStudent(3, 'Haddad Moshe Chaim', 60, 3, ['P','L','A','P','P','P'], 'therapy', 's8', [{staffId:'s8',type:'Counseling',hrs:3}], [{date:'2025-06-01',staff:'Rabbi Klein',notes:'Left voicemail',duration:'2 min'}]),
  mkStudent(4, 'Hayon David', 95, 0, ['P','P','P','P','P','P'], 'present', null, [], [], [{date:'2025-06-02',author:'Rabbi Klein',text:'Excellent week.'}]),
  mkStudent(5, 'Karman Yitzchok', 20, 5, ['A','A','A','P','P','P'], 'absent'),
  mkStudent(6, 'Levitz Avrohom', 70, 1, ['P','P','P','L','P','P'], 'hallway', 's10', [{staffId:'s7',type:'OT',hrs:2}], [{date:'2025-05-20',staff:'Rabbi Klein',notes:'General check-in',duration:'5 min'}], [], true, 'OT IEP - sensory processing'),
  mkStudent(7, 'Rosenfeld Yehuda', 55, 6, ['P','P','P','P','A','P'], 'late', null, [], [], [], false, '', true),
  mkStudent(8, 'Schwartz Moishe Michael', 40, 2, ['L','L','L','L','P','P'], 'present', null, [{staffId:'s8',type:'Counseling',hrs:0.5}]),
  mkStudent(9, 'Simon Eliyahu', 65, 1, ['P','P','P','P','P','P'], 'not-arrived', 's10'),
  mkStudent(10, 'Berkowitz Avraham', 55, 1, ['P','P','P','P','P','P'], 'present'),
  mkStudent(11, 'Dinowitz Shmuel', 70, 0, ['P','P','P','P','P','A'], 'present'),
  mkStudent(12, 'Ettlinger Moshe', 30, 4, ['L','P','P','A','P','P'], 'present'),
  mkStudent(13, 'Feldman Shraga', 85, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(14, 'Feltman Daniel', 45, 2, ['P','A','P','P','L','P'], 'therapy', 's9', [{staffId:'s9',type:'Therapy',hrs:2}]),
  mkStudent(15, 'Gantz Tzvi', 60, 1, ['P','P','P','P','P','P'], 'present'),
  mkStudent(16, 'Hickson Shlomo', 25, 5, ['A','A','P','P','P','P'], 'absent'),
  mkStudent(17, 'Mezei Yehuda', 90, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(18, 'Reich Nathan', 50, 3, ['P','L','P','P','A','P'], 'hallway', 's11'),
  mkStudent(19, 'Teitelbaum Binyamin', 75, 1, ['P','P','P','P','P','P'], 'present'),
  mkStudent(20, 'Yanni Shimon', 40, 2, ['P','P','A','P','P','P'], 'present'),
  mkStudent(21, 'Moskowitz Meir Shulem', 65, 0, ['P','P','P','P','P','P'], 'present'),
]

const statusColor = { present: '#2563eb', absent: '#dc2626', late: '#d97706', therapy: '#7c3aed', hallway: '#0891b2', 'not-arrived': '#6b7280' }
const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', therapy: 'In Therapy', hallway: 'In Hallway', 'not-arrived': 'Not Arrived' }
const statusEmoji = { present: '✅', absent: '❌', late: '⏰', therapy: '🧠', hallway: '🚶', 'not-arrived': '❓' }

function daysSince(dateStr) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b']

function getImprovement(s) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#16a34a', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#16a34a', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#dc2626', icon: '📉' }
  return { label: 'Same as last week', color: '#d97706', icon: '➡️' }
}

const S = {
  app: { fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: '#f4f5f7', color: '#1a1a2e' },
  sidebar: { width: 220, background: '#1a1f36', color: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 },
  sidebarItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', borderRadius: 6, margin: '1px 8px', background: active ? 'rgba(255,255,255,0.12)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: active ? 600 : 400 }),
  main: { marginLeft: 220, padding: '28px 32px', minHeight: '100vh' },
  card: { background: '#fff', borderRadius: 10, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e8eaed' },
  statCard: (color) => ({ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8eaed', borderTop: `3px solid ${color}` }),
  badge: (color, bg) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant) => {
    const map = { primary: ['#1a1f36','#fff'], danger: ['#dc2626','#fff'], ghost: ['#f4f5f7','#374151'], success: ['#166534','#fff'], purple: ['#5b21b6','#fff'], warning: ['#92400e','#fff'] }
    return { padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1] }
  },
  tag: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + '15', color, border: `1px solid ${color}30` }),
  avatar: (idx, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0 }),
}

// ─── DRILL DOWN MODAL ────────────────────────────────────────────────────────
function DrillDown({ title, students, onClose, onSelectStudent }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#1a1f36', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title} <span style={{ opacity: 0.6, fontSize: 13 }}>({students.length})</span></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {students.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No students in this category</div>}
          {students.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const imp = getImprovement(s)
            return (
              <div key={s.id} onClick={() => onSelectStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8, cursor: 'pointer', background: '#fafafa' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}>
                <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                    <span style={{ fontSize: 11, color: imp.color, fontWeight: 600 }}>{imp.icon} {imp.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>reminders</div></div>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>View →</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [role, setRole] = useState('admin')
  const accounts = {
    admin: { name: 'Rabbi Baum', email: 'rbaum@hadranacademy.org' },
    teacher: { name: 'Rabbi Klein', email: 'rklein@hadranacademy.org' },
    therapist: { name: 'Yitzi Liebowitz', email: 'yliebowitz@hadranacademy.org' },
  }
  return (
    <div style={{ minHeight: '100vh', background: '#1a1f36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', width: 820, display: 'flex', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ flex: 1, padding: '52px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1f36' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>Hadran<br/>Academy</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>Student Management System</div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            {[['🎓','Menahel Dashboard'],['👨‍🏫','Teacher Portal'],['🧠','Therapist Access'],['🛒','Canteen Store']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}><span>{icon}</span><span>{label}</span></div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f36', marginBottom: 4 }}>Welcome Back</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>Sign in to your account</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign in as</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['admin','Menahel/Admin'],['teacher','Teacher'],['therapist','Therapist']].map(([r, label]) => (
                <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '9px 6px', borderRadius: 6, border: `2px solid ${role === r ? '#1a1f36' : '#e5e7eb'}`, background: role === r ? '#1a1f36' : '#fff', color: role === r ? '#fff' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</div>
            <input value={accounts[role].email} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => onLogin(role, accounts[role].name)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1a1f36', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sign In →</button>
          <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Need help? Contact admin@hadranacademy.org</div>
        </div>
      </div>
    </div>
  )
}

// ─── STUDENT PROFILE ─────────────────────────────────────────────────────────
function StudentProfile({ student, students, setStudents, onClose, role, defaultTab = 'overview' }) {
  const [tab, setTab] = useState(defaultTab)
  const [noteText, setNoteText] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [callStaff, setCallStaff] = useState('Rabbi Klein')
  const [callDuration, setCallDuration] = useState('')
  const s = students.find(x => x.id === student.id)
  const improvement = getImprovement(s)
  const absCount = s.att.filter(d => d === 'A').length
  const lateCount = s.att.filter(d => d === 'L').length
  const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
  const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null

  function addNote() { if (!noteText.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, notes: [...x.notes, { date: new Date().toISOString().slice(0,10), author: callStaff, text: noteText }] } : x)); setNoteText('') }
  function addCall() { if (!callNotes.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentCalls: [...x.parentCalls, { date: new Date().toISOString().slice(0,10), staff: callStaff, notes: callNotes, duration: callDuration }] } : x)); setCallNotes(''); setCallDuration('') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#1a1f36', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={S.avatar(s.id - 1, 48)}>{initials(s.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ ...S.tag(statusColor[s.status]), fontSize: 11 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
              {withStaffObj && <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>👤 With {withStaffObj.name}</span>}
              {s.iep && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>📋 IEP</span>}
              {s.detention && <span style={{ background: 'rgba(220,38,38,0.3)', color: '#fca5a5', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>⚠️ Detention</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, color: '#fff', textAlign: 'center' }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>{s.points}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Points</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: s.reminders >= 6 ? '#f87171' : '#fff' }}>{s.reminders}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Reminders</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: '#f87171' }}>{absCount}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Absences</div></div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', padding: '0 24px', background: '#fafafa' }}>
          {['overview','attendance','behavior','therapy','calls','notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '2px solid #1a1f36' : '2px solid transparent', color: tab === t ? '#1a1f36' : '#6b7280', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: '#f4f5f7' }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>This Week Summary</div>
                {[['Present days', s.att.filter(d=>d==='P').length+'/6'],['Late arrivals', lateCount],['Absences', absCount],['Points balance', s.points+' pts'],['Reminders this week', s.reminders],['Last parent call', lastCall ? daysSince(lastCall.date)+'d ago' : 'Never']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f5f7', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...S.card, borderLeft: `3px solid ${improvement.color}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>📈 Improvement vs Last Week</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: improvement.color }}>{improvement.icon} {improvement.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Last week: {s.lastWeekReminders} · This week: {s.reminders}</div>
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Attendance</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {DAYS.map((day, i) => (
                      <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{day}</div>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe', color: s.att[i]==='P'?'#16a34a':s.att[i]==='A'?'#dc2626':'#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, margin: '0 auto' }}>{s.att[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {withStaffObj && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #0891b2' }}><div style={{ fontWeight: 700, color: '#0891b2', marginBottom: 4, fontSize: 13 }}>📍 Currently With</div><div style={{ fontSize: 14 }}><strong>{withStaffObj.name}</strong> — {withStaffObj.role}</div></div>}
              {s.iep && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #7c3aed' }}><div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 4, fontSize: 13 }}>📋 IEP</div><div style={{ fontSize: 13 }}>{s.iepDetails}</div></div>}
            </div>
          )}
          {tab === 'attendance' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Attendance Record</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #e8eaed' }}><th style={{ textAlign: 'left', padding: 10 }}>Day</th><th style={{ padding: 10, textAlign: 'center' }}>Status</th><th style={{ padding: 10, textAlign: 'center' }}>Breakfast</th></tr></thead>
                <tbody>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'].map((day, i) => (
                    <tr key={day} style={{ borderBottom: '1px solid #f4f5f7' }}>
                      <td style={{ padding: 10 }}>{day}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.att[i]==='P'?'#166534':s.att[i]==='A'?'#dc2626':'#1d4ed8', s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe')}>{s.att[i]==='P'?'Present':s.att[i]==='A'?'Absent':'Late'}</span></td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.breakfast[i]==='Y'?'#166534':'#dc2626', s.breakfast[i]==='Y'?'#dcfce7':'#fee2e2')}>{s.breakfast[i]==='Y'?'✓ Breakfast':'✗ Skipped'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ ...S.statCard('#d97706'), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Points</div><div style={{ fontSize: 26, fontWeight: 800, color: '#d97706' }}>{s.points}</div></div>
                <div style={{ ...S.statCard('#dc2626'), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Reminders</div><div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>{s.reminders}</div></div>
                <div style={{ ...S.statCard(improvement.color), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Trend</div><div style={{ fontSize: 13, fontWeight: 700, color: improvement.color, marginTop: 4 }}>{improvement.icon} {improvement.label}</div></div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Behavior Log</div>
                {s.behaviorLog.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13 }}>No behavior events yet.</div> : s.behaviorLog.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f5f7', fontSize: 13 }}>
                    <span>{b.label}</span><span style={{ fontWeight: 700, color: b.points > 0 ? '#166534' : '#dc2626' }}>{b.points > 0 ? '+' : ''}{b.points}</span><span style={{ color: '#9ca3af' }}>{b.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'therapy' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Therapy & Services</div>
              {s.services.length === 0 ? <div style={{ color: '#9ca3af' }}>No therapy services assigned.</div> : s.services.map((svc, i) => {
                const staffMember = STAFF.find(st => st.id === svc.staffId)
                return <div key={i} style={{ background: '#f4f5f7', borderRadius: 8, padding: 14, marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{svc.type}</div><div style={{ color: '#6b7280', fontSize: 13 }}>With: <strong>{staffMember?.name}</strong></div><div style={{ color: '#5b21b6', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{svc.hrs} hrs/week</div></div>
              })}
            </div>
          )}
          {tab === 'calls' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📞 Parent Call Log</div>
              {s.parentCalls.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>No calls recorded yet.</div> : s.parentCalls.map((c, i) => (
                <div key={i} style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{c.staff}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{c.date} · {c.duration}</span></div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{c.notes}</div>
                </div>
              ))}
              {role !== 'therapist' && (
                <div style={{ marginTop: 14, borderTop: '1px solid #e8eaed', paddingTop: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Log a new call</div>
                  <input placeholder="Staff name" value={callStaff} onChange={e => setCallStaff(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <input placeholder="Duration (e.g. 5 min)" value={callDuration} onChange={e => setCallDuration(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <textarea placeholder="Call notes..." value={callNotes} onChange={e => setCallNotes(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                  <button onClick={addCall} style={S.btn('primary')}>Log Call</button>
                </div>
              )}
            </div>
          )}
          {tab === 'notes' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Staff Notes</div>
              {s.notes.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>No notes yet.</div> : s.notes.map((n, i) => (
                <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 12 }}>{n.author}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{n.date}</span></div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{n.text}</div>
                </div>
              ))}
              <div style={{ marginTop: 14, borderTop: '1px solid #e8eaed', paddingTop: 14 }}>
                <textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                <button onClick={addNote} style={S.btn('primary')}>Add Note</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TEACHING MODE ───────────────────────────────────────────────────────────
function TeachingMode({ students, setStudents, onExit, isAdmin }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  function toggleSelect(id) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function applyToSelected(amount, label) {
    playSound(amount > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => selected.includes(s.id) ? { ...s, points: Math.max(0, s.points + amount), reminders: amount < 0 ? s.reminders + 1 : s.reminders, behaviorLog: [{ label, points: amount, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
    setSelected([])
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f4f5f7', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1a1f36', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isAdmin ? '🎓 School-Wide Mode' : '🏫 Teaching Mode'}</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." style={{ padding: '7px 12px', borderRadius: 6, border: 'none', fontSize: 13, width: 220, background: 'rgba(255,255,255,0.15)', color: '#fff' }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{filtered.length} students</div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button onClick={() => setSelected(filtered.map(s => s.id))} style={S.btn('ghost')}>☑ Select All</button>
          <button onClick={() => setSelected([])} style={S.btn('ghost')}>✕ Clear</button>
          <button onClick={onExit} style={S.btn('danger')}>← Exit</button>
        </div>
      </div>
      {selected.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1f36' }}>{selected.length} selected:</div>
          {BEHAVIORS_POSITIVE.map(b => <button key={b.id} onClick={() => applyToSelected(b.points, b.label)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+{b.points} {b.label}</button>)}
          {BEHAVIORS_NEGATIVE.map(b => <button key={b.id} onClick={() => applyToSelected(b.points, b.label)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{b.points} {b.label}</button>)}
          <button onClick={() => applyToSelected(10, 'Bonus')} style={{ ...S.btn('success'), padding: '4px 12px', fontSize: 12 }}>+10</button>
          <button onClick={() => applyToSelected(-10, 'Deduction')} style={{ ...S.btn('danger'), padding: '4px 12px', fontSize: 12 }}>-10</button>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
          {filtered.map((s, i) => {
            const isSelected = selected.includes(s.id)
            return (
              <div key={s.id} style={{ background: '#fff', border: `2px solid ${isSelected ? '#1a1f36' : '#e8eaed'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', position: 'relative' }} onClick={() => toggleSelect(s.id)}>
                {isSelected && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#1a1f36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={S.avatar(i, 34)}>{initials(s.name)}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div><span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+2, behaviorLog: [{label:'+2', points:2, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+5, behaviorLog: [{label:'+5', points:5, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => { playSound('negative'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: Math.max(0,x.points-1), reminders: x.reminders+1, behaviorLog: [{label:'Reminder', points:-1, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── TEACHER DASHBOARD ───────────────────────────────────────────────────────
function TeacherDashboard({ students, setStudents, userName, setSelectedStudent, setTeachingMode }) {
  const present = students.filter(s => s.status === 'present').length
  const absent = students.filter(s => s.status === 'absent').length
  const late = students.filter(s => s.status === 'late').length
  const inTherapy = students.filter(s => s.status === 'therapy').length
  const notArrived = students.filter(s => s.status === 'not-arrived').length
  const inHallway = students.filter(s => s.status === 'hallway').length
  const total = students.length

  function quickPoints(id, amount) {
    playSound(amount > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => s.id === id ? { ...s, points: Math.max(0, s.points + amount), behaviorLog: [{ label: amount > 0 ? `+${amount} pts` : `${amount} pts`, points: amount, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
  }
  function quickReminder(id) {
    playSound('negative')
    setStudents(prev => prev.map(s => s.id === id ? { ...s, reminders: s.reminders + 1, behaviorLog: [{ label: 'Reminder', points: -1, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Dargei Beis · Wednesday, June 4, 2025 · {total} students</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        {[['Present', present, '#2563eb'],['Absent', absent, '#dc2626'],['Late', late, '#d97706'],['Therapy', inTherapy, '#7c3aed'],['Hallway', inHallway, '#0891b2'],['Not Arrived', notArrived, '#6b7280']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e8eaed', textAlign: 'center', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick action button */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('primary'), padding: '10px 20px', fontSize: 14 }}>🏫 Enter Teaching Mode</button>
      </div>

      {/* Student cards with quick actions */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 My Students — Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {students.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            return (
              <div key={s.id} style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                      {withStaffObj && <span style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => quickPoints(s.id, 2)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => quickPoints(s.id, 5)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => quickPoints(s.id, 10)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+10</button>
                  <button onClick={() => quickReminder(s.id)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Who is not in class */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Right Now</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {students.filter(s => s.status !== 'present').map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ background: '#fafafa', border: '1px solid #e8eaed', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: statusColor[s.status], fontWeight: 600 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>
                {withStaffObj && <div style={{ fontSize: 10, color: '#0891b2', marginTop: 2 }}>👤 {withStaffObj.name}</div>}
              </div>
            )
          })}
          {students.filter(s => s.status !== 'present').length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, gridColumn: 'span 4', textAlign: 'center', padding: '1rem' }}>All students present ✅</div>}
        </div>
      </div>
    </div>
  )
}

// ─── THERAPIST DASHBOARD ─────────────────────────────────────────────────────
function TherapistDashboard({ students, userName, setSelectedStudent }) {
  const myStudents = students.filter(s => s.services.length > 0)
  const inSessionNow = students.filter(s => s.status === 'therapy')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Therapist Portal · Wednesday, June 4, 2025</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[['My Students', myStudents.length, '#5b21b6'],['In Session Now', inSessionNow.length, '#166534'],['Sessions This Week', THERAPY_SCHEDULE.length, '#0891b2']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #e8eaed', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 My Students</div>
          {myStudents.map((s, i) => {
            const imp = getImprovement(s)
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}>
                <div style={S.avatar(i, 36)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    <span style={{ fontSize: 11, color: imp.color, fontWeight: 600 }}>{imp.icon}</span>
                  </div>
                </div>
                <div>
                  {s.services.map((svc, j) => <div key={j} style={{ fontSize: 11, color: '#5b21b6', fontWeight: 600 }}>{svc.type}</div>)}
                </div>
              </div>
            )
          })}
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 This Week's Sessions</div>
          {THERAPY_SCHEDULE.map((t, i) => {
            const staffMember = STAFF.find(st => st.id === t.staffId)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f4f5f7' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#5b21b6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{t.type} · {t.duration}</div>
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

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('admin')
  const [userName, setUserName] = useState('')
  const [page, setPage] = useState('dashboard')
  const [students, setStudents] = useState(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentTab, setSelectedStudentTab] = useState('overview')
  const [storeStudent, setStoreStudent] = useState(null)
  const [behaviorStudent, setBehaviorStudent] = useState(null)
  const [behaviorTab, setBehaviorTab] = useState('positive')
  const [attFilter, setAttFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [teachingMode, setTeachingMode] = useState(false)
  const [drillDown, setDrillDown] = useState(null)

  function handleLogin(r, name) { setRole(r); setUserName(name); setLoggedIn(true); setPage('dashboard') }
  function openStudent(s, tab = 'overview') { setSelectedStudent(s); setSelectedStudentTab(tab) }
  function updateStatus(id, status) { setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s)) }
  function addPoints(id, amount) { playSound(amount > 0 ? 'positive' : 'negative'); setStudents(prev => prev.map(s => s.id === id ? { ...s, points: Math.max(0, s.points + amount) } : s)) }
  function addReminder(id) { const s = students.find(x => x.id === id); playSound(s && s.reminders + 1 >= 6 ? 'redmark' : 'negative'); setStudents(prev => prev.map(s => s.id === id ? { ...s, reminders: s.reminders + 1 } : s)) }
  function applyBehavior(studentId, beh) {
    playSound(beh.points > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, points: Math.max(0, s.points + beh.points), reminders: beh.points < 0 ? s.reminders + 1 : s.reminders, behaviorLog: [{ label: beh.label, points: beh.points, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) }))
  }
  function buyItem(studentId, cost, itemName) {
    const s = students.find(x => x.id === studentId)
    if (!s || s.points < cost) { alert('Not enough points!'); return }
    playSound('store'); setStudents(prev => prev.map(x => x.id === studentId ? { ...x, points: x.points - cost } : x)); alert(`${s.name} redeemed: ${itemName}!`)
  }

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />
  if (teachingMode) return <TeachingMode students={students} setStudents={setStudents} onExit={() => setTeachingMode(false)} isAdmin={role === 'admin'} />

  const present = students.filter(s => s.status === 'present').length
  const absent = students.filter(s => s.status === 'absent').length
  const late = students.filter(s => s.status === 'late').length
  const inTherapy = students.filter(s => s.status === 'therapy').length
  const inHallway = students.filter(s => s.status === 'hallway').length
  const notArrived = students.filter(s => s.status === 'not-arrived').length
  const total = students.length
  const improved = students.filter(s => s.reminders < s.lastWeekReminders).length
  const needsAttention = students.filter(s => s.reminders > s.lastWeekReminders).length
  const urgentStudents = students.filter(s => s.reminders >= 6 || s.detention || s.att.filter(d=>d==='A').length >= 3)
  const callsDueStudents = students.filter(s => { const lc = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length-1] : null; return !lc || daysSince(lc.date) > 14 })

  const alerts = students.flatMap(s => {
    const a = []; const absCount = s.att.filter(d => d === 'A').length; const lateCount = s.att.filter(d => d === 'L').length
    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
    if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
    if (s.reminders >= 6) a.push({ student: s.name, id: s.id, msg: '6 reminders — consequence required!', type: 'danger' })
    if (s.reminders >= 4 && s.reminders < 6) a.push({ student: s.name, id: s.id, msg: `${s.reminders} reminders this week`, type: 'warn' })
    if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: `Absent ${absCount} days this week`, type: absCount >= 3 ? 'danger' : 'warn' })
    if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: `Late ${lateCount} days`, type: 'warn' })
    if (!lastCall || daysSince(lastCall.date) > 14) a.push({ student: s.name, id: s.id, msg: lastCall ? `No parent call in ${daysSince(lastCall.date)} days` : 'Parent never called', type: 'info' })
    return a
  })

  // Nav per role
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'students', label: 'All Students', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
    { id: 'calls', label: 'Parent Calls', icon: '📞' },
  ]
  const teacherNav = [
    { id: 'dashboard', label: 'My Class', icon: '🏫' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
  ]
  const therapistNav = [
    { id: 'dashboard', label: 'My Students', icon: '🧠' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'students', label: 'All Students', icon: '👥' },
  ]

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : therapistNav
  const searchedStudents = search ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : students
  const filteredStudents = attFilter === 'all' ? searchedStudents : searchedStudents.filter(s => s.status === attFilter)

  function ClickStatCard({ label, val, color, sub, filterStudents, openTab = null }) {
    return (
      <div onClick={() => filterStudents && (openTab ? openTab() : setDrillDown({ title: label, students: filterStudents }))}
        style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #e8eaed', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: filterStudents ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { if (filterStudents) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {filterStudents && <span style={{ fontSize: 10, color: '#9ca3af' }}>click to view →</span>}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Hadran Academy</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
            {role === 'admin' ? 'Menahel Portal' : role === 'teacher' ? 'Teacher Portal' : 'Therapist Portal'}
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map(item => (
            <div key={item.id} style={S.sidebarItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: 14 }}>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
          {role !== 'therapist' && (
            <div onClick={() => setTeachingMode(true)} style={{ ...S.sidebarItem(false), background: 'rgba(255,255,255,0.08)', margin: '8px 8px 2px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span>{role === 'admin' ? '🎓' : '🏫'}</span>
              <span>{role === 'admin' ? 'School-Wide Mode' : 'Teaching Mode'}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{userName}</div>
          <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Logout</button>
        </div>
      </div>

      <div style={S.main}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search students..." style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e8eaed', fontSize: 13, width: 260, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
          {search && <button onClick={() => setSearch('')} style={{ ...S.btn('ghost'), padding: '6px 10px', fontSize: 12 }}>✕</button>}
        </div>

        {/* ── DASHBOARD — role based ── */}
        {page === 'dashboard' && role === 'teacher' && (
          <TeacherDashboard students={students} setStudents={setStudents} userName={userName} setSelectedStudent={s => openStudent(s)} setTeachingMode={setTeachingMode} />
        )}
        {page === 'dashboard' && role === 'therapist' && (
          <TherapistDashboard students={students} userName={userName} setSelectedStudent={s => openStudent(s, 'therapy')} />
        )}
        {page === 'dashboard' && role === 'admin' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1a1f36' }}>Good morning, {userName}</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Wednesday, June 4, 2025 · Dargei Beis · {total} students</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
              <ClickStatCard label="Total Students" val={total} color="#1a1f36" sub="enrolled" filterStudents={students} />
              <ClickStatCard label="Present Today" val={present} color="#2563eb" sub={`${Math.round(present/total*100)}% attendance`} filterStudents={students.filter(s=>s.status==='present')} />
              <ClickStatCard label="Absent Today" val={absent} color="#dc2626" sub="need follow-up" filterStudents={students.filter(s=>s.status==='absent')} />
              <ClickStatCard label="Urgent Alerts" val={urgentStudents.length} color="#dc2626" sub="require action"
                filterStudents={urgentStudents}
                openTab={urgentStudents.length > 0 ? () => setPage('alerts') : null} />
              <ClickStatCard label="Parent Calls Due" val={callsDueStudents.length} color="#d97706" sub="not called recently"
                filterStudents={callsDueStudents}
                openTab={callsDueStudents.length > 0 ? () => setPage('calls') : null} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Late Today', val: late, color: '#d97706', icon: '⏰', filter: students.filter(s=>s.status==='late') },
                { label: 'In Therapy', val: inTherapy, color: '#7c3aed', icon: '🧠', filter: students.filter(s=>s.status==='therapy') },
                { label: 'In Hallway', val: inHallway, color: '#0891b2', icon: '🚶', filter: students.filter(s=>s.status==='hallway') },
                { label: 'Not Arrived', val: notArrived, color: '#6b7280', icon: '❓', filter: students.filter(s=>s.status==='not-arrived') },
              ].map(stat => (
                <div key={stat.label} onClick={() => stat.filter.length > 0 && setDrillDown({ title: stat.label, students: stat.filter })}
                  style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 14, cursor: stat.filter.length > 0 ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { if (stat.filter.length > 0) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: 28 }}>{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</div>
                  </div>
                  {stat.filter.length > 0 && <span style={{ fontSize: 10, color: '#9ca3af' }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📈 Weekly Improvement Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div onClick={() => setDrillDown({ title: '📈 Improved This Week', students: students.filter(s=>s.reminders<s.lastWeekReminders) })} style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>{improved}</div>
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>📈 Improved</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '📉 Needs Attention', students: students.filter(s=>s.reminders>s.lastWeekReminders) })} style={{ background: '#fef2f2', borderRadius: 8, padding: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{needsAttention}</div>
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>📉 Needs Attention</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '➡️ Same as Last Week', students: students.filter(s=>s.reminders===s.lastWeekReminders) })} style={{ background: '#fffbeb', borderRadius: 8, padding: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{total - improved - needsAttention}</div>
                    <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>➡️ Same</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflow: 'auto' }}>
                  {students.filter(s => s.reminders >= 4 || s.reminders > s.lastWeekReminders).slice(0, 5).map((s, i) => {
                    const imp = getImprovement(s)
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, cursor: 'pointer' }}>
                        <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: imp.color }}>{imp.icon} {imp.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔔 Urgent Alerts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' }}>
                  {alerts.filter(a => a.type === 'danger').slice(0, 6).map((a, i) => (
                    <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{a.student}</div>
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>{a.msg}</div>
                    </div>
                  ))}
                  {alerts.filter(a => a.type === 'danger').length === 0 && <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '1rem' }}>No urgent alerts ✅</div>}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📞 Calls Needed</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' }}>
                  {callsDueStudents.map((s, i) => {
                    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                    const days = lastCall ? daysSince(lastCall.date) : 999
                    return (
                      <div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '7px 10px', cursor: 'pointer' }}>
                        <div style={S.avatar(i, 24)}>{initials(s.name)}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 11 }}>{s.name}</div><div style={{ fontSize: 10, color: '#92400e' }}>{lastCall ? `${days}d ago` : 'Never'}</div></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ── */}
        {page === 'students' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>{role === 'admin' ? 'All Students' : 'My Students'}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchedStudents.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                const imp = getImprovement(s)
                return (
                  <div key={s.id} onClick={() => openStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px' }}>
                    <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                        {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, color: imp.color }}>{imp.icon} {imp.label}</span>
                        {s.iep && <span style={S.tag('#5b21b6')}>IEP</span>}
                        {s.detention && <span style={S.tag('#dc2626')}>Detention</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>reminders</div></div>
                      <div><div style={{ fontSize: 17, fontWeight: 800 }}>{s.att.filter(d => d==='A').length}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>absences</div></div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d` : 'Never'}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>last call</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {page === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Attendance</h1>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all',...Object.keys(statusLabel)].map(f => (
                  <button key={f} onClick={() => setAttFilter(f)} style={{ ...S.btn(attFilter === f ? 'primary' : 'ghost'), padding: '5px 10px', fontSize: 11 }}>{f === 'all' ? 'All' : statusLabel[f] || f}</button>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e8eaed' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
                    <th style={{ padding: 8, textAlign: 'center' }}>Status</th>
                    {DAYS.map(d => <th key={d} style={{ padding: 8, textAlign: 'center' }}>{d}</th>)}
                    <th style={{ padding: 8, textAlign: 'center' }}>P</th><th style={{ padding: 8, textAlign: 'center' }}>A</th><th style={{ padding: 8, textAlign: 'center' }}>L</th>
                    {role !== 'therapist' && <th style={{ padding: 8, textAlign: 'center' }}>Update</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f4f5f7' }}>
                      <td style={{ padding: '8px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={S.avatar(i, 28)}>{initials(s.name)}</div><span style={{ fontWeight: 500 }}>{s.name}</span></div></td>
                      <td style={{ padding: 8, textAlign: 'center' }}><span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span></td>
                      {s.att.map((d, j) => (<td key={j} style={{ padding: 8, textAlign: 'center' }}><span style={{ background: d==='P'?'#dcfce7':d==='A'?'#fee2e2':'#dbeafe', color: d==='P'?'#166534':d==='A'?'#dc2626':'#1d4ed8', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{d}</span></td>))}
                      <td style={{ textAlign: 'center', padding: 8 }}>{s.att.filter(d=>d==='P').length}</td>
                      <td style={{ textAlign: 'center', padding: 8, color: '#dc2626', fontWeight: 600 }}>{s.att.filter(d=>d==='A').length}</td>
                      <td style={{ textAlign: 'center', padding: 8, color: '#d97706', fontWeight: 600 }}>{s.att.filter(d=>d==='L').length}</td>
                      {role !== 'therapist' && (<td style={{ padding: '6px 8px' }}><select value={s.status} onChange={e => updateStatus(s.id, e.target.value)} style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }}>{Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {page === 'schedule' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>🗓️ Schedule</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Schedule — Dargei Beis</div>
                {SCHEDULE.map((period, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: period.subject === 'Break' || period.subject === 'Lunch' ? '#f9fafb' : '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: period.subject === 'Break' || period.subject === 'Lunch' ? '#e5e7eb' : '#1a1f36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{period.subject === 'Break' || period.subject === 'Lunch' ? '—' : period.period}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{period.subject}</div>{period.teacher && <div style={{ fontSize: 11, color: '#6b7280' }}>{period.teacher} · {period.room}</div>}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{period.time}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 Therapy Schedule</div>
                  {THERAPY_SCHEDULE.map((t, i) => {
                    const staffMember = STAFF.find(st => st.id === t.staffId)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#5b21b6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{staffMember?.name} · {t.type}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 600 }}>{t.time}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{t.duration}</div></div>
                      </div>
                    )
                  })}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Now</div>
                  {students.filter(s => s.status !== 'present').map((s, i) => {
                    const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, cursor: 'pointer', border: '1px solid #e8eaed', marginBottom: 6 }}>
                        <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div><div style={{ fontSize: 11, color: statusColor[s.status] }}>{statusEmoji[s.status]} {statusLabel[s.status]}{withStaffObj ? ` · ${withStaffObj.name}` : ''}</div></div>
                      </div>
                    )
                  })}
                  {students.filter(s => s.status !== 'present').length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>All present ✅</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BEHAVIOR ── */}
        {page === 'behavior' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Behavior & Points</h1>
            {behaviorStudent ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <button onClick={() => setBehaviorStudent(null)} style={S.btn('ghost')}>← Back</button>
                  <div style={S.avatar(behaviorStudent.id - 1, 38)}>{initials(behaviorStudent.name)}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{behaviorStudent.name}</div><div style={{ color: '#d97706', fontWeight: 700, fontSize: 13 }}>{students.find(s => s.id === behaviorStudent.id)?.points} pts · {students.find(s => s.id === behaviorStudent.id)?.reminders} reminders</div></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <button onClick={() => setBehaviorTab('positive')} style={S.btn(behaviorTab === 'positive' ? 'success' : 'ghost')}>✅ Positive</button>
                  <button onClick={() => setBehaviorTab('negative')} style={S.btn(behaviorTab === 'negative' ? 'danger' : 'ghost')}>⚠️ Reminders</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(behaviorTab === 'positive' ? BEHAVIORS_POSITIVE : BEHAVIORS_NEGATIVE).map(beh => (
                    <button key={beh.id} onClick={() => applyBehavior(behaviorStudent.id, beh)} style={{ background: behaviorTab === 'positive' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${behaviorTab === 'positive' ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{beh.label}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: behaviorTab === 'positive' ? '#166534' : '#dc2626' }}>{beh.points > 0 ? '+' : ''}{beh.points}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => addPoints(behaviorStudent.id, 10)} style={S.btn('success')}>+10 Points</button>
                  <button onClick={() => addPoints(behaviorStudent.id, -10)} style={S.btn('danger')}>-10 Points</button>
                  <button onClick={() => addReminder(behaviorStudent.id)} style={{ ...S.btn('danger'), background: '#7f1d1d' }}>⚠️ Reminder</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[...searchedStudents].sort((a, b) => b.points - a.points).map((s, i) => (
                  <div key={s.id} onClick={() => setBehaviorStudent(s)} style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                    <div style={S.avatar(s.id - 1, 36)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div style={{ display: 'flex', gap: 6, marginTop: 4 }}><span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>{s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STORE ── */}
        {page === 'store' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Token Store</h1>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a student</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {students.map(s => (<button key={s.id} onClick={() => setStoreStudent(s.id)} style={{ padding: '6px 12px', borderRadius: 6, border: `2px solid ${storeStudent === s.id ? '#1a1f36' : '#e5e7eb'}`, cursor: 'pointer', fontSize: 12, fontWeight: storeStudent === s.id ? 700 : 400, background: storeStudent === s.id ? '#1a1f36' : '#fff', color: storeStudent === s.id ? '#fff' : '#374151' }}>{s.name} · {s.points} pts</button>))}
              </div>
            </div>
            {storeStudent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {STORE_ITEMS.map(item => { const s = students.find(x => x.id === storeStudent); const canAfford = s && s.points >= item.cost; return (<div key={item.id} style={{ ...S.card, textAlign: 'center', opacity: canAfford ? 1 : 0.5 }}><div style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</div><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div><div style={{ color: '#d97706', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>{item.cost} pts</div><button onClick={() => buyItem(storeStudent, item.cost, item.name)} style={{ ...S.btn(canAfford ? 'success' : 'ghost'), width: '100%', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: 12 }}>{canAfford ? 'Redeem' : 'Not enough'}</button></div>) })}
              </div>
            )}
          </div>
        )}

        {/* ── ALERTS ── */}
        {page === 'alerts' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>All Alerts ({alerts.length})</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No alerts ✅</div>}
              {alerts.map((a, i) => (<div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'danger' ? '#fecaca' : a.type === 'warn' ? '#fde68a' : '#bfdbfe'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><div><div style={{ fontWeight: 700, fontSize: 13 }}>{a.student}</div><div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{a.msg}</div></div><span style={{ fontSize: 12, color: '#9ca3af' }}>View →</span></div>))}
            </div>
          </div>
        )}

        {/* ── CALLS ── */}
        {page === 'calls' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Parent Call Log</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {students.map((s, i) => { const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null; const days = lastCall ? daysSince(lastCall.date) : 999; return (<div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${days > 14 ? '#f97316' : '#16a34a'}`, padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={S.avatar(i, 32)}>{initials(s.name)}</div><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: days > 14 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>{lastCall ? `Last call: ${days} days ago` : '⚠️ Never called'}</div></div><div style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{s.parentCalls.length} calls</div></div>{lastCall && <div style={{ fontSize: 12, color: '#6b7280', background: '#f4f5f7', borderRadius: 6, padding: '6px 10px' }}>{lastCall.notes}</div>}</div>) })}
            </div>
          </div>
        )}
      </div>

      {drillDown && <DrillDown title={drillDown.title} students={drillDown.students} onClose={() => setDrillDown(null)} onSelectStudent={s => { openStudent(s); setDrillDown(null) }} />}
      {selectedStudent && <StudentProfile student={selectedStudent} students={students} setStudents={setStudents} onClose={() => setSelectedStudent(null)} role={role} defaultTab={selectedStudentTab} />}
    </div>
  )
}
