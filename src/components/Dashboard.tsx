import { useState, useEffect } from 'react'

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
  { id: 1, name: "Reisman's Brownie Bar", cost: 20, emoji: '🍫', vip: false },
  { id: 2, name: 'Ice Cream Cone', cost: 25, emoji: '🍦', vip: false },
  { id: 3, name: 'Ice Cream Stick', cost: 20, emoji: '🍧', vip: false },
  { id: 4, name: 'Slush', cost: 15, emoji: '🧊', vip: false },
  { id: 5, name: 'Pizza Slice', cost: 50, emoji: '🍕', vip: true },
  { id: 6, name: 'Fresh Cookie', cost: 30, emoji: '🍪', vip: true },
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

const SCHEDULE_PERIODS = [
  { id: 1, time: '10:10 - 11:10', subject: 'Period 1', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Period 2', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 3, time: '12:15 - 12:45', subject: 'Period 3', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 4, time: '12:45 - 1:45', subject: 'Lunch & Recess', teachers: [], type: 'break' },
  { id: 5, time: '1:45 - 2:25', subject: 'English', teachers: ['Mr. Cohen'], type: 'class' },
  { id: 6, time: '2:30 - 3:10', subject: 'Period 5', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 7, time: '3:15 - 3:45', subject: 'Period 6', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
]

const THERAPY_SCHEDULE = [
  { student: 'Bloom Yair', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
  { student: 'Levitz Avrohom', staffId: 's7', day: 'Wed', time: '10:10', duration: '45 min', type: 'OT' },
  { student: 'Feltman Daniel', staffId: 's9', day: 'Thu', time: '10:10', duration: '45 min', type: 'Therapy' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Fri', time: '11:20', duration: '30 min', type: 'Counseling' },
]

const mkStudent = (id, name, points, reminders, att, status, withStaff = null, services = [], parentCalls = [], notes = [], iep = false, iepDetails = '', detention = false) => ({
  id, name, points, reminders, lastWeekReminders: reminders + Math.floor(Math.random() * 3),
  att, breakfast: att.map(() => Math.random() > 0.3 ? 'Y' : 'N'),
  detention, status, withStaff, services, parentCalls, notes, behaviorLog: [], iep, iepDetails
})

const initialStudents = [
  mkStudent(1, 'Bloom Yair', 45, 2, ['P','P','L','L','L','P'], 'present', null, [{staffId:'s6',type:'Speech Therapy',hrs:1.5}], [{date:'2025-05-28',staff:'Rabbi Klein',notes:'Discussed attendance',duration:'8 min'}], [{date:'2025-05-30',author:'Rabbi Klein',text:'Improving in davening.'}], true, 'Speech IEP - review Aug 2025', true),
  mkStudent(2, 'Friedlander Zev', 80, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(3, 'Haddad Moshe Chaim', 60, 3, ['P','L','A','P','P','P'], 'therapy', 's8', [{staffId:'s8',type:'Counseling',hrs:3}], [{date:'2025-06-01',staff:'Rabbi Klein',notes:'Left voicemail',duration:'2 min'}]),
  mkStudent(4, 'Hayon David', 95, 0, ['P','P','P','P','P','P'], 'present', null, [], [], [{date:'2025-06-02',author:'Rabbi Klein',text:'Excellent week.'}]),
  mkStudent(5, 'Karman Yitzchok', 20, 5, ['A','A','A','P','P','P'], 'absent'),
  mkStudent(6, 'Levitz Avrohom', 70, 1, ['P','P','P','L','P','P'], 'with-bt', 's10', [{staffId:'s7',type:'OT',hrs:2}], [{date:'2025-05-20',staff:'Rabbi Klein',notes:'General check-in',duration:'5 min'}], [], true, 'OT IEP - sensory processing'),
  mkStudent(7, 'Rosenfeld Yehuda', 55, 6, ['P','P','P','P','A','P'], 'late', null, [], [], [], false, '', true),
  mkStudent(8, 'Schwartz Moishe Michael', 40, 2, ['L','L','L','L','P','P'], 'present', null, [{staffId:'s8',type:'Counseling',hrs:0.5}]),
  mkStudent(9, 'Simon Eliyahu', 65, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(10, 'Berkowitz Avraham', 55, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(11, 'Dinowitz Shmuel', 70, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(12, 'Ettlinger Moshe', 30, 4, ['L','P','P','A','P','P'], 'present'),
  mkStudent(13, 'Feldman Shraga', 85, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(14, 'Feltman Daniel', 45, 2, ['P','A','P','P','L','P'], 'therapy', 's9', [{staffId:'s9',type:'Therapy',hrs:2}]),
  mkStudent(15, 'Gantz Tzvi', 60, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(16, 'Hickson Shlomo', 25, 5, ['A','A','P','P','P','P'], 'absent'),
  mkStudent(17, 'Mezei Yehuda', 90, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(18, 'Reich Nathan', 50, 3, ['P','L','P','P','A','P'], 'with-bt', 's11'),
  mkStudent(19, 'Teitelbaum Binyamin', 75, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(20, 'Yanni Shimon', 40, 2, ['P','P','A','P','P','P'], 'present'),
  mkStudent(21, 'Moskowitz Meir Shulem', 65, 0, ['P','P','P','P','P','P'], 'present'),
]

const statusColor = { present: '#2563eb', absent: '#dc2626', late: '#d97706', therapy: '#7c3aed', 'with-bt': '#0891b2', unknown: '#6b7280', 'not-arrived': '#9ca3af' }
const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', therapy: 'In Therapy', 'with-bt': 'With BT', unknown: 'Location Unknown', 'not-arrived': 'Not Arrived' }
const statusEmoji = { present: '✅', absent: '❌', late: '⏰', therapy: '🧠', 'with-bt': '👤', unknown: '❓', 'not-arrived': '🕐' }

function daysSince(dateStr) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b']

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function LiveClock() {
  const now = useNow()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const day = days[now.getDay()]
  const date = `${day}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return <span style={{ color: '#6b7280', fontSize: 13 }}>{date} · {time}</span>
}

function getImprovement(s) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#16a34a', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#16a34a', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#dc2626', icon: '📉' }
  return { label: 'Same as last week', color: '#d97706', icon: '➡️' }
}

function isVIP(s) { return s.reminders === 0 && s.att.every(d => d === 'P') }

const S = {
  app: { fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: '#f4f5f7', color: '#1a1a2e', display: 'flex' },
  sidebar: { width: 220, background: '#1a1f36', color: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 },
  sidebarItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', borderRadius: 6, margin: '1px 8px', background: active ? 'rgba(255,255,255,0.12)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: active ? 600 : 400 }),
  main: { marginLeft: 220, padding: '24px 140px', minHeight: '100vh', flex: 1, width: 'calc(100% - 220px)', boxSizing: 'border-box' },
  card: { background: '#fff', borderRadius: 10, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e8eaed' },
  statCard: (color) => ({ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8eaed', borderTop: `3px solid ${color}` }),
  badge: (color, bg) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant) => {
    const map = { primary: ['#1a1f36','#fff'], danger: ['#dc2626','#fff'], ghost: ['#f4f5f7','#374151'], success: ['#166534','#fff'], purple: ['#5b21b6','#fff'], gold: ['#854d0e','#fef9c3'] }
    return { padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1] }
  },
  tag: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + '15', color, border: `1px solid ${color}30` }),
  avatar: (idx, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0 }),
}

function DrillDown({ title, students, onClose, onSelectStudent }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#1a1f36', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title} <span style={{ opacity: 0.6, fontSize: 13 }}>({students.length})</span></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {students.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No students</div>}
          {students.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const vip = isVIP(s)
            return (
              <div key={s.id} onClick={() => onSelectStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8, cursor: 'pointer', background: '#fafafa' }}>
                <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.name}{vip && <span style={{ background: '#854d0e', color: '#fef9c3', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>⭐ VIP</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>remind.</div></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('admin')
  const [emailInput, setEmailInput] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const accounts = [
    { role: 'admin', name: 'Rabbi Baum', email: 'rbaum@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Ehrnreich', email: 'rehrnreich@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Klein', email: 'rklein@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Goldstein', email: 'rgoldstein@hadranacademy.org' },
    { role: 'therapist', name: 'Yitzi Liebowitz', email: 'yliebowitz@hadranacademy.org' },
    { role: 'therapist', name: 'Mrs. Goldberg', email: 'mgoldberg@hadranacademy.org' },
  ]
  const filtered = emailInput.length > 1 ? accounts.filter(a => a.email.toLowerCase().includes(emailInput.toLowerCase()) || a.name.toLowerCase().includes(emailInput.toLowerCase())) : []
  function selectAccount(acc) { setEmailInput(acc.email); setRole(acc.role); setShowSuggestion(false) }
  function handleLogin() {
    const acc = accounts.find(a => a.email === emailInput) || accounts.find(a => a.role === role)
    if (acc) onLogin(acc.role, acc.name)
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
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</div>
            <input value={emailInput} onChange={e => { setEmailInput(e.target.value); setShowSuggestion(true) }} onFocus={() => setShowSuggestion(true)} placeholder="Start typing your name or email..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
            {showSuggestion && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' }}>
                {filtered.map((acc, i) => (
                  <div key={i} onClick={() => selectAccount(acc)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f4f5f7', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{acc.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1a1f36', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sign In →</button>
          <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Need help? Contact admin@hadranacademy.org</div>
        </div>
      </div>
    </div>
  )
}

function StudentProfile({ student, students, setStudents, onClose, role, defaultTab = 'overview' }) {
  const [tab, setTab] = useState(defaultTab)
  const [noteText, setNoteText] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [callStaff, setCallStaff] = useState('Rabbi Klein')
  const [callDuration, setCallDuration] = useState('')
  const s = students.find(x => x.id === student.id)
  const improvement = getImprovement(s)
  const vip = isVIP(s)
  const absCount = s.att.filter(d => d === 'A').length
  const lateCount = s.att.filter(d => d === 'L').length
  const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
  const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null

  function addNote() { if (!noteText.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, notes: [...x.notes, { date: new Date().toISOString().slice(0,10), author: callStaff, text: noteText }] } : x)); setNoteText('') }
  function addCall() { if (!callNotes.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentCalls: [...x.parentCalls, { date: new Date().toISOString().slice(0,10), staff: callStaff, notes: callNotes, duration: callDuration }] } : x)); setCallNotes(''); setCallDuration('') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: vip ? 'linear-gradient(135deg, #854d0e, #a16207)' : '#1a1f36', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={S.avatar(s.id - 1, 48)}>{initials(s.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {s.name}{vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>⭐ VIP</span>}
            </div>
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
              {vip && <div style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #fef9c3, #fef08a)', border: '2px solid #ca8a04', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 32 }}>⭐</span><div><div style={{ fontWeight: 800, fontSize: 15, color: '#854d0e' }}>VIP Student!</div><div style={{ fontSize: 13, color: '#92400e' }}>Perfect week — eligible for VIP rewards!</div></div></div>}
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>This Week Summary</div>
                {[['Present days', s.att.filter(d=>d==='P').length+'/6'],['Late arrivals', lateCount],['Absences', absCount],['Points', s.points+' pts'],['Reminders', s.reminders],['Last call', lastCall ? daysSince(lastCall.date)+'d ago' : 'Never']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f5f7', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...S.card, borderLeft: `3px solid ${improvement.color}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>📈 vs Last Week</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: improvement.color }}>{improvement.icon} {improvement.label}</div>
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
              {s.status === 'unknown' && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #dc2626', background: '#fef2f2' }}><div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4, fontSize: 13 }}>❓ Location Unknown</div><div style={{ fontSize: 13, color: '#dc2626' }}>Student location is unaccounted for. Please locate immediately.</div></div>}
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
                {s.behaviorLog.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13 }}>No events yet.</div> : s.behaviorLog.map((b, i) => (
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

function TeachingMode({ students, setStudents, onExit, isAdmin }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [leavePopup, setLeavePopup] = useState(null)
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredStaff = leaveStaffSearch.length > 0 ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase())) : STAFF

  function toggleSelect(id) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function applyToSelected(amount, label) {
    playSound(amount > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => selected.includes(s.id) ? { ...s, points: Math.max(0, s.points + amount), reminders: amount < 0 ? s.reminders + 1 : s.reminders, behaviorLog: [{ label, points: amount, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
    setSelected([])
  }

  function handleToggle(s) {
    if (s.status === 'present') {
      setLeavePopup(s.id); setLeaveReason('therapy'); setLeaveStaffSearch(''); setLeaveStaffId('')
    } else {
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, status: 'present', withStaff: null } : x))
    }
  }

  function confirmLeave() {
    const statusMap = { therapy: 'therapy', 'with-bt': 'with-bt', menahel: 'present', unknown: 'unknown', other: 'unknown' }
    setStudents(prev => prev.map(x => x.id === leavePopup ? { ...x, status: statusMap[leaveReason] || 'unknown', withStaff: leaveStaffId || null } : x))
    setLeavePopup(null)
  }

  const leaveStudent = leavePopup ? students.find(s => s.id === leavePopup) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f4f5f7', zIndex: 200, display: 'flex', flexDirection: 'column' }}>

      {/* Leave popup */}
      {leavePopup && leaveStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#1a1f36', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>🚪 {leaveStudent.name} is leaving class</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[['therapy','🧠 Therapy'],['with-bt','👤 With BT'],['menahel','🎓 Called to Menahel'],['unknown','❓ Location Unknown'],['other','📝 Other']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#1a1f36' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f4f5f7' : '#fff' }}>
                    <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                    <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 13 }}>{label}</span>
                  </label>
                ))}
              </div>
              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>With whom?</div>
                  <input value={leaveStaffSearch} onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }} placeholder="Start typing name..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 4 }} />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f4f5f7' : '#fff', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#6b7280', fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#1a1f36', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isAdmin ? '🎓 School-Wide Mode' : '🏫 Teaching Mode'}</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." style={{ padding: '7px 12px', borderRadius: 6, border: 'none', fontSize: 13, width: 220, background: 'rgba(255,255,255,0.15)', color: '#fff' }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{filtered.filter(s => s.status === 'present').length}/{filtered.length} in class</div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button onClick={() => setStudents(prev => prev.map(s => ({ ...s, status: 'present', withStaff: null })))} style={S.btn('ghost')}>✅ All Present</button>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtered.map((s, i) => {
            const isSelected = selected.includes(s.id)
            const vip = isVIP(s)
            const inClass = s.status === 'present'
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : inClass ? '#fff' : '#fef2f2', border: `2px solid ${isSelected ? '#1a1f36' : vip ? '#ca8a04' : inClass ? '#e8eaed' : '#fecaca'}`, borderRadius: 10, padding: '12px', position: 'relative' }}>
                {vip && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 13 }}>⭐</div>}

                {/* Name + select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleSelect(s.id)}>
                  <div style={{ ...S.avatar(i, 32), outline: isSelected ? '3px solid #1a1f36' : 'none' }}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {withStaffObj ? <div style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</div> : <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span>}
                  </div>
                </div>

                {/* Points + reminders */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>

                {/* Quick points */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+2, behaviorLog: [{label:'+2', points:2, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+5, behaviorLog: [{label:'+5', points:5, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => { playSound('negative'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: Math.max(0,x.points-1), reminders: x.reminders+1, behaviorLog: [{label:'Reminder', points:-1, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
                </div>

                {/* Toggle switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f4f5f7' }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: inClass ? '#166534' : '#dc2626' }}>{inClass ? '✅ In Class' : '🚪 Left Class'}</span>
                  <div onClick={() => handleToggle(s)} style={{ width: 40, height: 22, borderRadius: 11, background: inClass ? '#16a34a' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: inClass ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TeacherDashboard({ students, setStudents, userName, setSelectedStudent, setTeachingMode }) {
  const present = students.filter(s => s.status === 'present').length
  const absent = students.filter(s => s.status === 'absent').length
  const late = students.filter(s => s.status === 'late').length
  const inTherapy = students.filter(s => s.status === 'therapy').length
  const withBT = students.filter(s => s.status === 'with-bt').length
  const unknown = students.filter(s => s.status === 'unknown').length

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
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Dargei Beis · Wednesday, June 4 · {students.length} students</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[['Present', present, '#2563eb'],['Absent', absent, '#dc2626'],['Late', late, '#d97706'],['Therapy', inTherapy, '#7c3aed'],['With BT', withBT, '#0891b2'],['Unknown', unknown, '#dc2626']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e8eaed', textAlign: 'center', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('primary'), padding: '10px 20px', fontSize: 14 }}>🏫 Enter Teaching Mode</button>
      </div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 My Students — Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {students.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const vip = isVIP(s)
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : s.status === 'unknown' ? '#fef2f2' : '#fafafa', border: `1px solid ${vip ? '#ca8a04' : s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                      {vip && <span style={{ fontSize: 10 }}>⭐</span>}
                    </div>
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
    </div>
  )
}

function TherapistDashboard({ students, userName, setSelectedStudent }) {
  const myStudents = students.filter(s => s.services.length > 0)
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Therapist Portal · Wednesday, June 4</p>
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
                <div>{s.services.map((svc, j) => <div key={j} style={{ fontSize: 11, color: '#5b21b6', fontWeight: 600 }}>{svc.type}</div>)}</div>
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

// ── ATTENDANCE PAGE WITH TOGGLE ──────────────────────────────────────────────
function AttendancePage({ students, setStudents, role, attFilter, setAttFilter, filteredStudents, openStudent }) {
  const [leavePopup, setLeavePopup] = useState(null) // { studentId }
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')

  const filteredStaff = leaveStaffSearch.length > 0
    ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase()) || st.role.toLowerCase().includes(leaveStaffSearch.toLowerCase()))
    : STAFF

  function handleToggle(s) {
    if (s.status === 'present') {
      // Turning off — show popup to pick reason
      setLeavePopup(s.id)
      setLeaveReason('therapy')
      setLeaveStaffSearch('')
      setLeaveStaffId('')
    } else {
      // Turning on — mark present
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, status: 'present', withStaff: null } : x))
    }
  }

  function confirmLeave() {
    const statusMap = { therapy: 'therapy', 'with-bt': 'with-bt', menahel: 'present', hallway: 'unknown', other: 'unknown' }
    const newStatus = statusMap[leaveReason] || 'unknown'
    setStudents(prev => prev.map(x => x.id === leavePopup ? { ...x, status: newStatus, withStaff: leaveStaffId || null } : x))
    setLeavePopup(null)
  }

  const leaveStudent = leavePopup ? students.find(s => s.id === leavePopup) : null

  return (
    <div>
      {/* Leave Popup */}
      {leavePopup && leaveStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#1a1f36', padding: '16px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🚪 {leaveStudent.name} is leaving class</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Select reason for leaving</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['therapy', '🧠 Therapy'],
                    ['with-bt', '👤 With BT'],
                    ['menahel', '🎓 Called to Menahel'],
                    ['hallway', '❓ Location Unknown'],
                    ['other', '📝 Other'],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#1a1f36' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f4f5f7' : '#fff' }}>
                      <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                      <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 14 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>With whom? (start typing)</div>
                  <input
                    value={leaveStaffSearch}
                    onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }}
                    placeholder="Type staff name..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 }}
                  />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f4f5f7' : '#fff', borderBottom: '1px solid #f4f5f7' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                      {filteredStaff.length === 0 && <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 13 }}>No staff found</div>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Attendance</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all',...Object.keys(statusLabel)].map(f => (
            <button key={f} onClick={() => setAttFilter(f)} style={{ ...S.btn(attFilter === f ? 'primary' : 'ghost'), padding: '5px 10px', fontSize: 11 }}>{f === 'all' ? 'All' : statusLabel[f] || f}</button>
          ))}
        </div>
      </div>

      {/* Toggle grid — clean teacher view */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🔄 Live Class Toggle</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStudents(prev => prev.map(s => ({ ...s, status: 'present', withStaff: null })))} style={{ ...S.btn('success'), padding: '5px 12px', fontSize: 12 }}>✅ All Present</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {filteredStudents.map((s, i) => {
            const inClass = s.status === 'present'
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            return (
              <div key={s.id} style={{ background: inClass ? '#f0fdf4' : s.status === 'unknown' ? '#fef2f2' : '#fafafa', border: `2px solid ${inClass ? '#86efac' : s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {withStaffObj && <div style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</div>}
                    {!inClass && !withStaffObj && <div style={{ fontSize: 10, color: statusColor[s.status], fontWeight: 600 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>}
                  </div>
                </div>
                {/* Toggle switch */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: inClass ? '#166534' : '#dc2626', fontWeight: 600 }}>{inClass ? 'In Class' : 'Left Class'}</span>
                  <div onClick={() => role !== 'therapist' && handleToggle(s)} style={{ width: 44, height: 24, borderRadius: 12, background: inClass ? '#16a34a' : '#e5e7eb', position: 'relative', cursor: role !== 'therapist' ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: inClass ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly attendance table */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 Weekly Attendance Record</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8eaed' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Status</th>
              {DAYS.map(d => <th key={d} style={{ padding: 8, textAlign: 'center' }}>{d}</th>)}
              <th style={{ padding: 8, textAlign: 'center' }}>P</th>
              <th style={{ padding: 8, textAlign: 'center' }}>A</th>
              <th style={{ padding: 8, textAlign: 'center' }}>L</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, i) => (
              <tr key={s.id} onClick={() => openStudent(s)} style={{ borderBottom: '1px solid #f4f5f7', background: s.status === 'unknown' ? '#fef2f2' : 'transparent', cursor: 'pointer' }}>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    {isVIP(s) && <span style={{ fontSize: 10 }}>⭐</span>}
                  </div>
                </td>
                <td style={{ padding: 8, textAlign: 'center' }}><span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span></td>
                {s.att.map((d, j) => (
                  <td key={j} style={{ padding: 8, textAlign: 'center' }}>
                    <span style={{ background: d==='P'?'#dcfce7':d==='A'?'#fee2e2':'#dbeafe', color: d==='P'?'#166534':d==='A'?'#dc2626':'#1d4ed8', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{d}</span>
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: 8 }}>{s.att.filter(d=>d==='P').length}</td>
                <td style={{ textAlign: 'center', padding: 8, color: '#dc2626', fontWeight: 600 }}>{s.att.filter(d=>d==='A').length}</td>
                <td style={{ textAlign: 'center', padding: 8, color: '#d97706', fontWeight: 600 }}>{s.att.filter(d=>d==='L').length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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
  const [todos, setTodos] = useState([
    { id: 1, date: '2025-06-10', time: '10:20 AM', text: 'Tour for Friedman family', category: 'meeting', done: false },
    { id: 2, date: '2025-06-10', time: '12:30 PM', text: 'Interview with Moshe Braver', category: 'meeting', done: false },
    { id: 3, date: '2025-06-10', time: '', text: 'Announce: bus will leave 5 min earlier starting tomorrow morning', category: 'announcement', done: false },
    { id: 4, date: '2025-06-10', time: '', text: 'Conversation with Zevi about changing levels', category: 'general', done: false },
    { id: 5, date: '2025-06-10', time: '', text: "Call Moshe Chaim's parents — plan for him to come on time", category: 'call', done: false },
    { id: 6, date: '2025-06-10', time: '', text: 'IEP meeting coming up soon — make appointment', category: 'appointment', done: false },
    { id: 7, date: '2025-06-10', time: '', text: 'Schedule meeting with Rabbi Ambush — topic: general', category: 'meeting', done: false },
    { id: 8, date: '2025-06-10', time: '', text: 'Make appointment by Rav for 10th grade farher', category: 'appointment', done: false },
  ])
  const [newTodo, setNewTodo] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('general')
  const [newTodoTime, setNewTodoTime] = useState('')

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
  const withBT = students.filter(s => s.status === 'with-bt').length
  const unknown = students.filter(s => s.status === 'unknown').length
  const notArrived = students.filter(s => s.status === 'not-arrived').length
  const total = students.length
  const improved = students.filter(s => s.reminders < s.lastWeekReminders).length
  const needsAttention = students.filter(s => s.reminders > s.lastWeekReminders).length
  const vipStudents = students.filter(s => isVIP(s))
  const urgentStudents = students.filter(s => s.reminders >= 6 || s.detention || s.att.filter(d=>d==='A').length >= 3 || s.status === 'unknown')
  const callsDueStudents = students.filter(s => { const lc = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length-1] : null; return !lc || daysSince(lc.date) > 14 })

  const alerts = students.flatMap(s => {
    const a = []; const absCount = s.att.filter(d => d === 'A').length; const lateCount = s.att.filter(d => d === 'L').length
    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
    if (s.status === 'unknown') a.push({ student: s.name, id: s.id, msg: '❓ Location unknown — please locate immediately!', type: 'danger' })
    if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
    if (s.reminders >= 6) a.push({ student: s.name, id: s.id, msg: '6 reminders — consequence required!', type: 'danger' })
    if (s.reminders >= 4 && s.reminders < 6) a.push({ student: s.name, id: s.id, msg: `${s.reminders} reminders this week`, type: 'warn' })
    if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: `Absent ${absCount} days this week`, type: absCount >= 3 ? 'danger' : 'warn' })
    if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: `Late ${lateCount} days`, type: 'warn' })
    if (!lastCall || daysSince(lastCall.date) > 14) a.push({ student: s.name, id: s.id, msg: lastCall ? `No parent call in ${daysSince(lastCall.date)} days` : 'Parent never called', type: 'info' })
    return a
  })

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'students', label: 'All Students', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
    { id: 'calls', label: 'Parent Calls', icon: '📞' },
    { id: 'todo', label: 'To-Do List', icon: '📋' },
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

  function ClickCard({ label, val, color, sub, filterStudents, goToPage = null }) {
    return (
      <div onClick={() => { if (goToPage) setPage(goToPage); else if (filterStudents) setDrillDown({ title: label, students: filterStudents }) }}
        style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #e8eaed', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: (filterStudents || goToPage) ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { if (filterStudents || goToPage) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {(filterStudents || goToPage) && <span style={{ fontSize: 10, color: '#9ca3af' }}>click →</span>}
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
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{role === 'admin' ? 'Menahel Portal' : role === 'teacher' ? 'Teacher Portal' : 'Therapist Portal'}</div>
        </div>
        <div style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map(item => (
            <div key={item.id} style={S.sidebarItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'alerts' && alerts.filter(a => a.type === 'danger').length > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              )}
            </div>
          ))}
          {role !== 'therapist' && (
            <div onClick={() => setTeachingMode(true)} style={{ ...S.sidebarItem(false), background: 'rgba(255,255,255,0.08)', margin: '8px 8px 2px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span>{role === 'admin' ? '🎓' : '🏫'}</span><span>{role === 'admin' ? 'School-Wide Mode' : 'Teaching Mode'}</span>
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

        {page === 'dashboard' && role === 'teacher' && <TeacherDashboard students={students} setStudents={setStudents} userName={userName} setSelectedStudent={s => openStudent(s)} setTeachingMode={setTeachingMode} />}
        {page === 'dashboard' && role === 'therapist' && <TherapistDashboard students={students} userName={userName} setSelectedStudent={s => openStudent(s, 'therapy')} />}

        {page === 'dashboard' && role === 'admin' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{getGreeting(new Date().getHours())}, {userName} 👋</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}><LiveClock /> · Dargei Beis · {total} students</p>
            </div>
            {unknown > 0 && (
              <div style={{ background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 10, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 900, color: '#dc2626', fontSize: 20 }}>❓ {unknown} student{unknown > 1 ? 's' : ''} with unknown location! </span>
                  <span style={{ fontSize: 15, color: '#dc2626', fontWeight: 600 }}>Please locate immediately</span>
                </div>
                <button onClick={() => setDrillDown({ title: '❓ Location Unknown', students: students.filter(s=>s.status==='unknown') })} style={{ ...S.btn('danger'), padding: '6px 18px', fontSize: 13, flexShrink: 0 }}>View</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
              <ClickCard label="Total" val={total} color="#1a1f36" sub="enrolled" filterStudents={students} />
              <ClickCard label="Present" val={present} color="#2563eb" sub={`${Math.round(present/total*100)}%`} filterStudents={students.filter(s=>s.status==='present')} />
              <ClickCard label="Absent" val={absent} color="#dc2626" sub="not in school" filterStudents={students.filter(s=>s.status==='absent')} />
              <ClickCard label="⭐ VIP" val={vipStudents.length} color="#854d0e" sub="perfect week" filterStudents={vipStudents} />
              <ClickCard label="Urgent" val={urgentStudents.length} color="#dc2626" sub="require action" goToPage="alerts" />
              <ClickCard label="Calls Due" val={callsDueStudents.length} color="#d97706" sub="not called" goToPage="calls" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Late Today', val: late, color: '#d97706', icon: '⏰', filter: students.filter(s=>s.status==='late') },
                { label: 'In Therapy', val: inTherapy, color: '#7c3aed', icon: '🧠', filter: students.filter(s=>s.status==='therapy') },
                { label: 'With BT', val: withBT, color: '#0891b2', icon: '👤', filter: students.filter(s=>s.status==='with-bt') },
                { label: '❓ Unknown', val: unknown, color: '#dc2626', icon: '❓', filter: students.filter(s=>s.status==='unknown') },
              ].map(stat => (
                <div key={stat.label} onClick={() => stat.filter.length > 0 && setDrillDown({ title: stat.label, students: stat.filter })}
                  style={{ background: stat.label === '❓ Unknown' && unknown > 0 ? '#fef2f2' : '#fff', borderRadius: 10, padding: '14px 18px', border: `1px solid ${stat.label === '❓ Unknown' && unknown > 0 ? '#fecaca' : '#e8eaed'}`, display: 'flex', alignItems: 'center', gap: 14, cursor: stat.filter.length > 0 ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 16 }}>
              {/* Column 1: To-Do */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>📋 Today's To-Do</div>
                  <button onClick={() => setPage('todo')} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflow: 'auto' }}>
                  {todos.filter(t => !t.done).map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8eaed' }}>
                      <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: true } : t))} style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{todo.text}</div>
                        {todo.time && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>🕐 {todo.time}</div>}
                      </div>
                    </div>
                  ))}
                  {todos.filter(t => !t.done).length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '1rem' }}>All done! ✅</div>}
                </div>
                <div style={{ marginTop: 10 }}>
                  <input placeholder="Quick add task... (press Enter)" onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: '', text: e.currentTarget.value.trim(), category: 'general', done: false }]); e.currentTarget.value = '' } }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Column 2: Weekly Improvement */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📈 Weekly Improvement</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div onClick={() => setDrillDown({ title: '📈 Improved', students: students.filter(s=>s.reminders<s.lastWeekReminders) })} style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{improved}</div>
                    <div style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>📈 Improved</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '📉 Needs Attention', students: students.filter(s=>s.reminders>s.lastWeekReminders) })} style={{ background: '#fef2f2', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{needsAttention}</div>
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>📉 Attention</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '⭐ VIP', students: vipStudents })} style={{ background: '#fefce8', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer', border: '1px solid #ca8a04' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#854d0e' }}>{vipStudents.length}</div>
                    <div style={{ fontSize: 10, color: '#854d0e', fontWeight: 600 }}>⭐ VIP</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflow: 'auto' }}>
                  {students.filter(s => s.reminders >= 4 || s.reminders > s.lastWeekReminders).slice(0, 5).map((s, i) => {
                    const imp = getImprovement(s)
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, cursor: 'pointer' }}>
                        <div style={S.avatar(i, 26)}>{initials(s.name)}</div>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: imp.color }}>{imp.icon}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Column 3: Urgent Alerts + Calls stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...S.card, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔔 Urgent Alerts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflow: 'auto' }}>
                    {alerts.filter(a => a.type === 'danger').slice(0, 4).map((a, i) => (
                      <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{a.student}</div>
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>{a.msg}</div>
                      </div>
                    ))}
                    {alerts.filter(a => a.type === 'danger').length === 0 && <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '0.5rem' }}>No urgent alerts ✅</div>}
                  </div>
                </div>
                <div style={{ ...S.card, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📞 Calls Needed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflow: 'auto' }}>
                    {callsDueStudents.slice(0, 5).map((s, i) => {
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
          </div>
        )}

        {page === 'students' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>All Students</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchedStudents.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                const imp = getImprovement(s)
                const vip = isVIP(s)
                return (
                  <div key={s.id} onClick={() => openStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px', borderLeft: vip ? '4px solid #ca8a04' : s.status === 'unknown' ? '4px solid #dc2626' : '1px solid #e8eaed' }}>
                    <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.name}
                        {vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>⭐ VIP</span>}
                        {s.status === 'unknown' && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>❓ Unknown</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                        {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, color: imp.color }}>{imp.icon} {imp.label}</span>
                        {s.iep && <span style={S.tag('#5b21b6')}>IEP</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>remind.</div></div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{s.att.filter(d=>d==='P').length}/6</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>days</div>
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 2 }}>
                          <div style={{ width: `${Math.round(s.att.filter(d=>d==='P').length/6*100)}%`, height: '100%', background: s.att.filter(d=>d==='P').length >= 5 ? '#16a34a' : s.att.filter(d=>d==='P').length >= 3 ? '#d97706' : '#dc2626', borderRadius: 2 }} />
                        </div>
                      </div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d` : 'Never'}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>last call</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {page === 'attendance' && (
          <AttendancePage students={students} setStudents={setStudents} role={role} attFilter={attFilter} setAttFilter={setAttFilter} filteredStudents={filteredStudents} openStudent={openStudent} />
        )}

        {page === 'schedule' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>🗓️ Schedule</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Schedule — Dargei Beis</div>
                {SCHEDULE_PERIODS.map((period, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: period.type === 'break' ? '#f9fafb' : '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8, opacity: period.type === 'break' ? 0.7 : 1 }}>
                    {period.type === 'class' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1a1f36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{period.id}</div>}
                    {period.type === 'break' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>—</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{period.subject}</div>
                      {period.teachers.length > 0 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{period.teachers.join(' · ')}</div>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: period.type === 'break' ? '#9ca3af' : '#1a1f36' }}>{period.time}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 Therapy Pullouts This Week</div>
                  {THERAPY_SCHEDULE.map((t, i) => {
                    const staffMember = STAFF.find(st => st.id === t.staffId)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#5b21b6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{staffMember?.name} · {t.type}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 700 }}>{t.time}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{t.duration}</div></div>
                      </div>
                    )
                  })}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Now</div>
                  {students.filter(s => s.status !== 'present').map((s, i) => {
                    const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: s.status === 'unknown' ? '#fef2f2' : '#fafafa', borderRadius: 6, cursor: 'pointer', border: `1px solid ${s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, marginBottom: 6 }}>
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
                {[...searchedStudents].sort((a, b) => b.points - a.points).map((s, i) => {
                  const vip = isVIP(s)
                  return (
                    <div key={s.id} onClick={() => setBehaviorStudent(s)} style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderLeft: vip ? '3px solid #ca8a04' : undefined }}>
                      <div style={S.avatar(s.id - 1, 36)}>{initials(s.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>{s.name}{vip && <span style={{ fontSize: 11 }}>⭐</span>}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                          {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {page === 'store' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>🛍 Token Store</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 18 }}>⭐ VIP items available only to students with a perfect week</p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a student</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {students.map(s => {
                  const vip = isVIP(s)
                  return (
                    <button key={s.id} onClick={() => setStoreStudent(s.id)} style={{ padding: '6px 12px', borderRadius: 6, border: `2px solid ${storeStudent === s.id ? '#1a1f36' : vip ? '#ca8a04' : '#e5e7eb'}`, cursor: 'pointer', fontSize: 12, fontWeight: storeStudent === s.id ? 700 : 400, background: storeStudent === s.id ? '#1a1f36' : vip ? '#fefce8' : '#fff', color: storeStudent === s.id ? '#fff' : '#374151' }}>
                      {vip && '⭐ '}{s.name} · {s.points} pts
                    </button>
                  )
                })}
              </div>
            </div>
            {storeStudent && (() => {
              const s = students.find(x => x.id === storeStudent)
              const vip = s && isVIP(s)
              return (
                <div>
                  {vip && <div style={{ background: '#fefce8', border: '2px solid #ca8a04', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 24 }}>⭐</span><div><div style={{ fontWeight: 700, color: '#854d0e' }}>VIP Student — All items unlocked!</div></div></div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {STORE_ITEMS.map(item => {
                      const canAfford = s && s.points >= item.cost
                      const canAccess = !item.vip || vip
                      return (
                        <div key={item.id} style={{ ...S.card, textAlign: 'center', opacity: canAccess ? (canAfford ? 1 : 0.5) : 0.3, position: 'relative' }}>
                          {item.vip && <div style={{ position: 'absolute', top: 8, right: 8, background: '#ca8a04', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>VIP</div>}
                          <div style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ color: '#d97706', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>{item.cost} pts</div>
                          <button onClick={() => canAccess ? buyItem(storeStudent, item.cost, item.name) : alert('VIP only!')} style={{ ...S.btn(canAccess && canAfford ? 'success' : 'ghost'), width: '100%', cursor: 'pointer', fontSize: 12 }}>
                            {!canAccess ? '🔒 VIP Only' : canAfford ? 'Redeem' : 'Not enough'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {page === 'alerts' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>All Alerts ({alerts.length})</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No alerts ✅</div>}
              {alerts.map((a, i) => (<div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'danger' ? '#fecaca' : a.type === 'warn' ? '#fde68a' : '#bfdbfe'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><div><div style={{ fontWeight: 700, fontSize: 13 }}>{a.student}</div><div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{a.msg}</div></div><span style={{ fontSize: 12, color: '#9ca3af' }}>View →</span></div>))}
            </div>
          </div>
        )}

        {page === 'calls' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Parent Call Log</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {students.map((s, i) => { const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null; const days = lastCall ? daysSince(lastCall.date) : 999; return (<div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${days > 14 ? '#f97316' : '#16a34a'}`, padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={S.avatar(i, 32)}>{initials(s.name)}</div><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: days > 14 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>{lastCall ? `Last call: ${days} days ago` : '⚠️ Never called'}</div></div><div style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{s.parentCalls.length} calls</div></div>{lastCall && <div style={{ fontSize: 12, color: '#6b7280', background: '#f4f5f7', borderRadius: 6, padding: '6px 10px' }}>{lastCall.notes}</div>}</div>) })}
            </div>
          </div>
        )}

        {page === 'todo' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>📋 To-Do List</h1>
            {/* Add new */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add New Task</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Task description..." onKeyDown={e => { if (e.key === 'Enter' && newTodo.trim()) { setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: newTodoTime, text: newTodo, category: newTodoCategory, done: false }]); setNewTodo(''); setNewTodoTime('') } }} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 200 }} />
                <input value={newTodoTime} onChange={e => setNewTodoTime(e.target.value)} placeholder="Time (e.g. 10:30 AM)" style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, width: 160 }} />
                <select value={newTodoCategory} onChange={e => setNewTodoCategory(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Phone Call</option>
                  <option value="announcement">Announcement</option>
                  <option value="appointment">Appointment</option>
                </select>
                <button onClick={() => { if (!newTodo.trim()) return; setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: newTodoTime, text: newTodo, category: newTodoCategory, done: false }]); setNewTodo(''); setNewTodoTime('') }} style={S.btn('primary')}>+ Add</button>
              </div>
            </div>

            {/* Todo list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Pending */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pending ({todos.filter(t => !t.done).length})</div>
              {todos.filter(t => !t.done).map(todo => {
                const catColors = { meeting: ['#5b21b6','#f5f3ff'], call: ['#166534','#dcfce7'], announcement: ['#92400e','#fef3c7'], appointment: ['#1d4ed8','#dbeafe'], general: ['#374151','#f4f5f7'] }
                const [cc, cb] = catColors[todo.category] || catColors.general
                return (
                  <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: true } : t))} style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{todo.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>📅 {todo.date}{todo.time ? ` · ${todo.time}` : ''}</span>
                        <span style={S.badge(cc, cb)}>{todo.category}</span>
                      </div>
                    </div>
                    <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
                  </div>
                )
              })}
              {todos.filter(t => !t.done).length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>All done! ✅</div>}

              {/* Done */}
              {todos.filter(t => t.done).length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Completed ({todos.filter(t => t.done).length})</div>
                  {todos.filter(t => t.done).map(todo => (
                    <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', opacity: 0.5 }}>
                      <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: false } : t))} style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13, color: '#6b7280' }}>{todo.text}</div>
                      <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {drillDown && <DrillDown title={drillDown.title} students={drillDown.students} onClose={() => setDrillDown(null)} onSelectStudent={s => { openStudent(s); setDrillDown(null) }} />}
      {selectedStudent && <StudentProfile student={selectedStudent} students={students} setStudents={setStudents} onClose={() => setSelectedStudent(null)} role={role} defaultTab={selectedStudentTab} />}
    </div>
  )
}
