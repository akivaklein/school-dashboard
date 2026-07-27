import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import playSound from '../utils/playSound'
import AttendancePage from './AttendancePage'
import BehaviorPage from './BehaviorPage'
import TeachingMode from './TeachingMode'
import StudentProfile from './StudentProfile'
import StudentNotes from './StudentNotes'
import StudentSupport from './StudentSupport'
import SchedulePage from './SchedulePage'
import TodoPage from './TodoPage'
import TokenStorePage from './TokenStorePage'
import AcademicsPage, { StudentScoresTab } from './AcademicsPage'
import SetupAssignmentsSection from './SetupAssignmentsSection'
import SetupTherapyScheduleSection from './SetupTherapyScheduleSection'
import SetupTeachingConfigSection from './SetupTeachingConfigSection'
import SetupVipRulesSection from './SetupVipRulesSection'
import SetupStoreSalesSection from './SetupStoreSalesSection'
import SetupAccountsSection from './SetupAccountsSection'
import AlertsPage from './AlertsPage'
import CallsPage from './CallsPage'
import StudentsListPage from './StudentsListPage'
import StaffDirectoryPage from './StaffDirectoryPage'
import AttendanceReportsPanel from './AttendanceReportsPanel'
import AdminMainDashboard from './AdminMainDashboard'
import {
  createPointsEvent,
  deletePointsEvent,
  listPointsEventsForStudent,
} from '../services/pointsEventsService'
import {
  listStudentFlags,
  replaceStudentFlags,
} from '../services/studentFlagsService'
import {
  adjustStoreItemStockBy,
  createStoreItem,
  createStoreRedemption,
  deleteStoreRedemption,
  listStoreItems,
  listStoreRedemptions,
  seedStoreItems,
  setStoreItemActive,
  updateStoreItem as saveStoreItem,
} from '../services/storeService'
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../services/todosService'
import {
  listTeachingActions,
  createTeachingAction,
  deleteTeachingAction,
  getVIPRules,
  updateVIPRules,
  listStoreSales,
  createStoreSale,
  updateStoreSale,
  deleteStoreSale,
  loadSetupAssignments,
  saveSetupAssignment,
  loadTherapySchedule,
  saveTherapySchedule,
  loadStaffAccounts,
  saveStaffAccount,
} from '../services/setupCenterService'
import {
  loadStaffMembers,
  getStaffByName,
  staffMatchesAnyRole,
} from '../services/staffService'
import {
  persistStudentFields,
  persistStudentFieldsBulk,
} from '../services/studentPersistenceService'
import { recordLoginSession, recordLogoutSession } from '../services/loginSessionService'
import {
  clearStudentFallbackPatch,
  getStudentFallbackPatchCount,
  readStudentFallbackPatches,
} from '../utils/studentFallbackCache'
import DrillDown from './dashboard/DrillDown'
import LoginPage from './dashboard/LoginPage'
import StaffLoginPanel from './StaffLoginPanel'
import StaffManagementModal from './StaffManagementModal'
import LoginActivityView from './LoginActivityView'

import {
  STORE_ITEMS,
  STORE_CATEGORY_OPTIONS,
  openAttendanceReportWindow,
  buildAttendanceReportRows,
  getAdmissionsReport,
  enrichIntakeDemoData,
  SKILL_RATINGS,
  RATING_SCORE,
  ACADEMIC_AREAS,
  DEFAULT_ACADEMIC_TEACHER,
  academicPct,
  academicDisplay,
  academicStatus,
  academicStatusColor,
  getStaffNameOptions,
  DAYS,
  TEACHER_CLASS_MAP,
  CLASSES,
  STUDENT_CLASSES,
  DIVISIONS,
  CLASS_DIVISION,
  studentDivision,
  resolveStudentClassId,
  getTeacherAssignedClassIds,
  getTeacherAssignedStudentIds,
  getUserAccess,
  defaultDivisionView,
  divisionLabel,
  SCHEDULE_PERIODS,
  THERAPY_SCHEDULE,
  HISTORICAL_DATA,
  initialStudents,
  statusColor,
  statusLabel,
  statusEmoji,
} from './dashboardData'

const INTAKE_ASSESSMENT_AREAS = [
  {
    section: 'Limudei Kodesh',
    helper: 'Core yeshiva readiness and classroom learning skills',
    items: [
      { label: 'Tefillah Participation', key: 'tefillah', icon: '🕍', detail: 'Follows along, participates, and stays focused during davening' },
      { label: 'Kriah Accuracy', key: 'kriah', icon: '📖', detail: 'Reads Hebrew with nekudos accurately, including siddur, Tehillim, and Chumash words' },
      { label: 'Gemara Text Reading', key: 'gemaraReading', icon: '📜', detail: 'Reads Gemara words clearly and fluently' },
      { label: 'Gemara Translation', key: 'gemaraTranslation', icon: '🔤', detail: 'Translates Gemara words, phrases, and common terms' },
      { label: 'Gemara Comprehension', key: 'gemaraComprehension', icon: '🧠', detail: 'Understands the flow of the sugya, questions, answers, and main ideas' },
      { label: 'Rashi Script', key: 'rashiScript', icon: '✒️', detail: 'Recognizes and reads Rashi letters' },
    ],
  },
  {
    section: 'General Studies',
    helper: 'Specific academic skills tested during the admissions review',
    items: [
      { label: 'Math: Addition', key: 'mathAddition', icon: '➕', detail: 'Single-digit, multi-digit, and regrouping skills' },
      { label: 'Math: Subtraction', key: 'mathSubtraction', icon: '➖', detail: 'Borrowing, regrouping, and multi-step accuracy' },
      { label: 'Math: Multiplication', key: 'mathMultiplication', icon: '✖️', detail: 'Facts, 2-digit multiplication, and computation fluency' },
      { label: 'Math: Division', key: 'mathDivision', icon: '➗', detail: 'Basic division, remainders, and long division readiness' },
      { label: 'English Reading Fluency', key: 'englishReading', icon: '📚', detail: 'Decoding, pacing, accuracy, and confidence while reading' },
      { label: 'Reading Comprehension', key: 'readingComprehension', icon: '🔎', detail: 'Understands passages, details, sequence, and main idea' },
      { label: 'Writing Skills', key: 'writingSkills', icon: '✍️', detail: 'Sentence structure, grammar, written response, and organization' },
      { label: 'Spelling / Vocabulary', key: 'spellingVocabulary', icon: '🔠', detail: 'Word recognition, spelling patterns, and vocabulary knowledge' },
    ],
  },
]

const INTAKE_PLACEMENT_LEVELS = [
  { key: 'foundational', label: 'Foundational', color: '#9a6a2a', bg: '#f7f1e8' },
  { key: 'developing', label: 'Developing', color: '#5b6f95', bg: '#edf2f7' },
  { key: 'independent', label: 'Independent', color: '#56765f', bg: '#eef4f0' },
]

const intakeScoreLabel = (val) => val === 0 ? '—' : val === 1 ? 'Needs Support' : val === 2 ? 'Emerging' : val === 3 ? 'Developing' : val === 4 ? 'Proficient' : 'Strong'
const intakeScoreColor = (val) => val >= 4 ? '#56765f' : val >= 3 ? '#5b6f95' : val > 0 ? '#9a6a2a' : '#94a3b8'

function daysSince(dateStr) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#334155','#475569','#3f4f63','#526070','#5f6c7a','#3f5f68','#5b5f7a','#606f64','#6f6254','#495867','#56616d','#4b6470','#6b6259','#576070','#425466','#6a5d68','#536157','#6a5848','#465a69','#64748b','#596475']

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
  return <span style={{ color: '#64748b', fontSize: 13 }}>{date} · {time}</span>
}

function getImprovement(s) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#56765f', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#56765f', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#9f1239', icon: '📉' }
  return { label: 'Same as last week', color: '#9a6a2a', icon: '➡️' }
}

function isVIP(s, rules: { minimumPoints: number; maximumReminders: number; minimumAttendance: number; requireAll: boolean }) {
  const presentCount = s.att.filter((d: string) => d === 'P').length
  const attPct = s.att.length > 0 ? (presentCount / s.att.length) * 100 : 100
  const checks = [
    s.points >= rules.minimumPoints,
    s.reminders <= rules.maximumReminders,
    attPct >= rules.minimumAttendance,
  ]
  return rules.requireAll ? checks.every(Boolean) : checks.some(Boolean)
}

function isStoreItemRestrictedForStudent(student, item) {
  if (!student || !item) return false
  const studentName = (student.name || '').toLowerCase()
  const itemName = (item.name || '').toLowerCase()
  const isChaimGoldberg = studentName === 'goldberg chaim' || studentName === 'chaim goldberg'
  const isCandyItem = itemName.includes('sour') || itemName.includes('candy') || itemName.includes('candies') || itemName.includes('lolly') || item.emoji === '🍬' || item.emoji === '🍭'
  return isChaimGoldberg && isCandyItem
}

const S = {
  app: { fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: '#f3f6fa', color: '#223046', display: 'flex', letterSpacing: '-0.01em' },
  sidebar: { width: 244, background: '#1f2c3f', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto', overflowX: 'hidden', boxShadow: '8px 0 24px rgba(31,44,63,0.10)' },
  sidebarLogo: { padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 10, flexShrink: 0 },
  sidebarItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderRadius: 10, margin: '3px 10px', background: active ? '#eef4fb' : 'transparent', color: active ? '#223046' : 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: active ? 700 : 500, transition: 'background 0.15s, color 0.15s, transform 0.15s', flexShrink: 0 }),
  main: { marginLeft: 244, padding: '32px 56px 50px 40px', minHeight: '100vh', flex: 1, width: 'calc(100% - 244px)', boxSizing: 'border-box' },
  card: { background: '#ffffff', borderRadius: 16, padding: '22px', boxShadow: '0 8px 22px rgba(30,41,59,0.05)', border: '1px solid #e2e8f0' },
  statCard: (color) => ({ background: '#ffffff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 8px 22px rgba(30,41,59,0.05)', border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}` }),
  badge: (color, bg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant) => {
    const map = { primary: ['#48698d','#fff'], danger: ['#a24860','#fff'], ghost: ['#eef3f8','#41556d'], success: ['#5a7a66','#fff'], purple: ['#6b7088','#fff'], gold: ['#8a7245','#fff8df'] }
    return { padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1], transition: 'transform 0.15s, box-shadow 0.15s' }
  },
  tag: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + '10', color, border: `1px solid ${color}22` }),
  avatar: (idx, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }),
}

// ── TRACKING TAB COMPONENT ────────────────────────────────────────────────────
function TrackingTab({ s, students, staffMembers }: { s: any; students: any[]; staffMembers: any[] }) {
  const [period, setPeriod] = useState('today')
  const [drillType, setDrillType] = useState(null) // 'in', 'out', or a date string
  const student = students.find(x => x.id === s.id) || s
  const histData = HISTORICAL_DATA[student.id] || []

  const filterData = () => {
    const now = new Date()
    const today = now.toISOString().slice(0,10)
    switch(period) {
      case 'today': return histData.filter(d => d.date === today).length > 0 ? histData.filter(d => d.date === today) : histData.slice(0,1)
      case 'week': { const weekAgo = new Date(now - 7*86400000).toISOString().slice(0,10); return histData.filter(d => d.date >= weekAgo) }
      case 'month': { const monthAgo = new Date(now - 30*86400000).toISOString().slice(0,10); return histData.filter(d => d.date >= monthAgo) }
      case 'thismonth': return histData.filter(d => d.date.startsWith(now.toISOString().slice(0,7)))
      case 'year': return histData.filter(d => d.date.startsWith(new Date().getFullYear().toString()))
      default: return histData
    }
  }

  const data = filterData()
  const totalIn = data.reduce((acc, d) => acc + d.inMins, 0)
  const totalOut = data.reduce((acc, d) => acc + d.outMins, 0)
  const avgPct = data.length > 0 ? Math.round(totalIn / (totalIn + totalOut) * 100) : 0
  const pctColor = avgPct >= 70 ? '#56765f' : avgPct >= 50 ? '#9a6a2a' : '#9f1239'
  const staffTime = {}
  data.forEach(d => { if (d.staffName) staffTime[d.staffName] = (staffTime[d.staffName] || 0) + d.outMins })

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'Last 30 Days' },
    { id: 'thismonth', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ]

  if (histData.length === 0) {
    return (
      <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
        No class tracking data yet for this student.
        <br/><span style={{ fontSize: 12 }}>Data records automatically when teacher uses the Teaching Mode toggle.</span>
      </div>
    )
  }

  // Drill-down popup
  const DrillDownPopup = () => {
    if (!drillType) return null
    const isDateDrill = drillType !== 'in' && drillType !== 'out' && drillType !== 'late'
    const isIn = drillType === 'in'

    // Late drill-down
    if (drillType === 'late') {
      const lateDays = DAYS.map((day, i) => ({ day, i, status: student.att?.[i] })).filter(d => d.status === 'L' || d.status === 'LE')
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#9a6a2a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>⏰ Late Days — {student.name}</div>
              <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              {lateDays.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No late days this week</div>
              ) : lateDays.map((d, i) => {
                const fullDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
                const lateDetail = student.lateDetails
                return (
                  <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{fullDays[d.i]}</div>
                      <span style={S.badge('#92400e', '#fef3c7')}>{d.status === 'LE' ? '🚪 Left Early' : '⏰ Late'}</span>
                    </div>
                    {lateDetail?.timeArrived && <div style={{ fontSize: 13, color: '#334155' }}>⏰ Arrived: <strong>{lateDetail.timeArrived}</strong></div>}
                    {lateDetail?.reason && lateDetail.reason !== 'no-reason' && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {lateDetail.reason === 'parent-called' ? '📞 Parent called ahead' : lateDetail.reason === 'sick' ? '🤒 Sick' : lateDetail.reason === 'transport' ? '🚌 Transport issue' : lateDetail.reason === 'appointment' ? '🏥 Appointment' : lateDetail.reason}
                      </div>
                    )}
                    {lateDetail?.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontStyle: 'italic' }}>"{lateDetail.note}"</div>}
                    {!lateDetail?.timeArrived && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>No details recorded</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    if (isDateDrill && drillType !== 'late') {
      // Show specific day breakdown
      const dayData = histData.find(d => d.date === drillType) || data[0]
      const dayName = dayData ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(dayData.date).getDay()] : ''
      const todayLog = student.classLog || []
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>📅 {dayName} {drillType} — {student.name}</div>
              <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {dayData && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: '#56765f' }}>{dayData.inMins}m</div><div style={{ fontSize: 11, color: '#56765f' }}>In Class</div></div>
                    <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: '#9f1239' }}>{dayData.outMins}m</div><div style={{ fontSize: 11, color: '#9f1239' }}>Out</div></div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: dayData.pct >= 70 ? '#56765f' : '#9a6a2a' }}>{dayData.pct}%</div><div style={{ fontSize: 11, color: '#64748b' }}>In Class</div></div>
                  </div>
                  {dayData.staffName && <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>👤 Out with: <strong>{dayData.staffName}</strong></div>}
                  {todayLog.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Timeline:</div>
                      {todayLog.map((ev, i) => {
                        const staffObj = ev.staffId ? staffMembers.find(st => st.id === ev.staffId) : null
                        const period = SCHEDULE_PERIODS.find(p => { if (p.type !== 'class') return false; const [sh, sm] = p.time.split(' - ')[0].split(':').map(Number); const [eh, em] = p.time.split(' - ')[1].split(':').map(Number); const [ch, cm] = ev.time.split(':').map(Number); return (ch*60+cm) >= (sh*60+sm) && (ch*60+cm) <= (eh*60+em) })
                        return (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 12, color: '#64748b', minWidth: 44 }}>{ev.time}</span>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.type === 'in' ? '#56765f' : '#9f1239', marginTop: 3, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: ev.type === 'in' ? '#4b6854' : '#9f1239' }}>{ev.note}</div>
                              {period && <div style={{ fontSize: 11, color: '#64748b' }}>📚 {period.subject} · {period.teachers[0]}</div>}
                              {staffObj && <div style={{ fontSize: 11, color: '#6d28d9' }}>👤 {staffObj.name} — {staffObj.role}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )
    }
    const title = isIn ? '✅ Time In Class' : '🚪 Time Out of Class'

    // Build per-day, per-period breakdown from classLog + histData
    const breakdownData = data.map(d => ({
      date: d.date,
      mins: isIn ? d.inMins : d.outMins,
      staff: isIn ? null : d.staffName,
      pct: d.pct
    }))

    // For today's log breakdown by actual events
    const todayLog = student.classLog || []
    const hasDetailedLog = period === 'today' && todayLog.length > 0

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' }}>
          <div style={{ background: isIn ? '#4b6854' : '#9f1239', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{title} — {student.name}</div>
            <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: isIn ? '#4b6854' : '#9f1239', marginBottom: 12 }}>
              Total: {isIn ? totalIn : totalOut} min across {data.length} day{data.length !== 1 ? 's' : ''}
            </div>

            {/* Detailed log for today */}
            {hasDetailedLog && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>Today's Timeline</div>
                {todayLog.filter(e => isIn ? e.type === 'in' : e.type === 'out').map((ev, i) => {
                  const next = todayLog[todayLog.indexOf(ev) + 1]
                  const staffObj = ev.staffId ? staffMembers.find(st => st.id === ev.staffId) : null
                  const [ch, cm] = ev.time.split(':').map(Number)
                  const mins = next ? (() => { const [nh, nm] = next.time.split(':').map(Number); return (nh*60+nm)-(ch*60+cm) })() : null
                  // Find which class period this falls in
                  const period = SCHEDULE_PERIODS.find(p => {
                    const [sh, sm] = p.time.split(' - ')[0].split(':').map(Number)
                    const [eh, em] = p.time.split(' - ')[1].split(':').map(Number)
                    return p.type === 'class' && (ch*60+cm) >= (sh*60+sm) && (ch*60+cm) <= (eh*60+em)
                  })
                  return (
                    <div key={i} style={{ background: isIn ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.time} — {ev.note}</div>
                        {period && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📚 {period.subject} · {period.teachers[0]}</div>}
                        {staffObj && <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 2 }}>👤 {staffObj.name} — {staffObj.role}</div>}
                      </div>
                      {mins !== null && <div style={{ fontWeight: 700, fontSize: 14, color: isIn ? '#56765f' : '#9f1239' }}>{mins} min</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Per-day breakdown */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>By Day</div>
            {breakdownData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ minWidth: 80, fontSize: 12, color: '#64748b' }}>{d.date}</div>
                <div style={{ flex: 1, height: 6, background: '#f8fafc', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, d.mins/120*100)}%`, height: '100%', background: isIn ? '#56765f' : '#9f1239' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: isIn ? '#56765f' : '#9f1239', minWidth: 50, textAlign: 'right' }}>{d.mins} min</div>
                {!isIn && d.staff && <div style={{ fontSize: 11, color: '#6d28d9', minWidth: 80 }}>👤 {d.staff}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {drillType && <DrillDownPopup />}

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '6px 12px', borderRadius: 6, border: `2px solid ${period === p.id ? '#0f172a' : '#e5e7eb'}`, background: period === p.id ? '#0f172a' : '#fff', color: period === p.id ? '#fff' : '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
        ))}
      </div>

      {data.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No data for this period</div>
      ) : (
        <>
          {/* Clickable summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div onClick={() => setDrillType('in')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #56765f', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#56765f' }}>{totalIn} min</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>In Class</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>click for details →</div>
            </div>
            <div onClick={() => setDrillType('out')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #9f1239', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#9f1239' }}>{totalOut} min</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Out of Class</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>click for details →</div>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderTop: `3px solid ${pctColor}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: pctColor }}>{avgPct}%</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Avg In Class</div>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #6d28d9' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#6d28d9' }}>{data.length}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Days Tracked</div>
            </div>
            <div onClick={() => setDrillType('late')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #9a6a2a', cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#9a6a2a' }}>{student.att ? student.att.filter(d => d === 'L' || d === 'LE').length : 0}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Times Late</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>click for details →</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Overall Time Split</div>
            <div style={{ height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
              <div style={{ width: `${avgPct}%`, background: '#56765f' }} />
              <div style={{ flex: 1, background: '#fca5a5' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#56765f', fontWeight: 600 }}>🟢 In class: {avgPct}%</span>
              <span style={{ color: '#9f1239', fontWeight: 600 }}>🔴 Out: {100-avgPct}%</span>
            </div>
          </div>

          {/* Staff time */}
          {Object.keys(staffTime).length > 0 && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>👤 Time Out — By Staff Member</div>
              {Object.entries(staffTime).sort((a,b) => b[1]-a[1]).map(([name, mins]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>👤 {name}</span>
                  <div style={{ width: 120, height: 6, background: '#f8fafc', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, mins/totalOut*100)}%`, height: '100%', background: '#6d28d9', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', minWidth: 50, textAlign: 'right' }}>{mins} min</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily breakdown — clickable rows */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📅 Daily Breakdown <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(click any day for details)</span></div>
            {data.map((d, i) => {
              const color = d.pct >= 70 ? '#56765f' : d.pct >= 50 ? '#9a6a2a' : '#9f1239'
              const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d.date).getDay()]
              // Find which teacher was teaching that day based on day of week
              const dayIdx = new Date(d.date).getDay()
              const periodTeachers = SCHEDULE_PERIODS.filter(p => p.type === 'class').map(p => p.teachers[0]).filter(Boolean)
              return (
                <div key={i} onClick={() => setDrillType(d.date)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ minWidth: 100, fontSize: 12, fontWeight: 500 }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{dayName}</span>
                    <span style={{ color: '#64748b', marginLeft: 4 }}>{d.date}</span>
                  </div>
                  <div style={{ flex: 1, height: 8, background: '#f8fafc', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ width: `${d.pct}%`, height: '100%', background: color, borderRadius: 14 }} />
                  </div>
                  <div style={{ minWidth: 36, fontSize: 13, fontWeight: 700, color, textAlign: 'right' }}>{d.pct}%</div>
                  <div style={{ minWidth: 110, fontSize: 11, color: '#64748b', textAlign: 'right' }}>
                    <span style={{ color: '#56765f', fontWeight: 600 }}>{d.inMins}m</span> in / <span style={{ color: '#9f1239', fontWeight: 600 }}>{d.outMins}m</span> out
                  </div>
                  {d.staffName && <div style={{ fontSize: 11, color: '#6d28d9', minWidth: 90 }}>👤 {d.staffName}</div>}
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>→</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function FamilyEditorPopup({ s, setStudents, userName }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>✏️ Edit Family Info</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>✏️ Edit Family Info — {s.name}</div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <FamilyEditor s={s} setStudents={setStudents} userName={userName} onCancel={() => setOpen(false)} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

function MedicalEditorPopup({ s, setStudents, userName }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>✏️ Edit Medical Info</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 24px 70px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>🏥 Edit Medical Info — {s.name}</div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <MedicalEditor s={s} setStudents={setStudents} userName={userName} onCancel={() => setOpen(false)} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}


function FamilyEditor({ s, setStudents, userName, onCancel = null, onSaved = null }) {
  const [f, setF] = useState(s.family || {})

  async function save() {
    const nextFamily = {
      ...f,
      lastEditedBy: userName || 'Staff',
      lastEditedAt: new Date().toISOString(),
    }

    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, family: nextFamily } : x))
    
    // Persist to database
    await persistStudentFields(s.id, { family: nextFamily })
    
    if (onSaved) onSaved()
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[['fatherName','Father Name'],['fatherPhone','Father Phone'],['fatherEmail','Father Email'],['motherName','Mother Name'],['motherPhone','Mother Phone'],['motherEmail','Mother Email']].map(([key, label]) => (
          <input key={key} placeholder={label} value={f[key]||''} onChange={e => setF(prev => ({...prev, [key]: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        ))}
      </div>
      <input placeholder="Home Address" value={f.address||''} onChange={e => setF(prev => ({...prev, address: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <input placeholder="Emergency Contact" value={f.emergencyContact||''} onChange={e => setF(prev => ({...prev, emergencyContact: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        <input placeholder="Emergency Phone" value={f.emergencyPhone||''} onChange={e => setF(prev => ({...prev, emergencyPhone: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancel && <button onClick={onCancel} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>}
        <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
      </div>
    </div>
  )
}

function MedicalEditor({ s, setStudents, userName, onCancel = null, onSaved = null }) {
  const [m, setM] = useState(s.medical || {})

  async function save() {
    const nextMedical = {
      ...m,
      lastEditedBy: userName || 'Staff',
      lastEditedAt: new Date().toISOString(),
    }

    setStudents(prev => prev.map(x => x.id === s.id ? { ...x, medical: nextMedical } : x))
    
    // Persist to database
    await persistStudentFields(s.id, { medical: nextMedical })
    
    if (onSaved) onSaved()
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>🏥 Doctor Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Doctor Name" value={m.doctorName||''} onChange={e => setM(prev => ({...prev, doctorName: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
          <input placeholder="Doctor Phone" value={m.doctorPhone||''} onChange={e => setM(prev => ({...prev, doctorPhone: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>💊 Allergies</div>
        <textarea placeholder="List allergies (comma-separated), e.g.: peanuts (severe), shellfish (moderate)" value={m.allergiesText||''} onChange={e => setM(prev => ({...prev, allergiesText: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📋 Conditions</div>
        <textarea placeholder="List conditions (comma-separated), e.g.: asthma, diabetes, anxiety" value={m.conditionsText||''} onChange={e => setM(prev => ({...prev, conditionsText: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📝 Last Physical</div>
        <input placeholder="Date of last physical" value={m.lastPhysical||''} onChange={e => setM(prev => ({...prev, lastPhysical: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📌 Medical Notes</div>
        <textarea placeholder="Any additional medical notes..." value={m.notes||''} onChange={e => setM(prev => ({...prev, notes: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancel && <button onClick={onCancel} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>}
        <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
      </div>
    </div>
  )
}


function TeacherDashboard({ students, setStudents, userName, setSelectedStudent, setTeachingMode, initialClass = null, setDrillDown, recordStudentPointsAction, isVIP }) {
  const [selectedClass, setSelectedClass] = useState(initialClass)

  useEffect(() => {
    setSelectedClass(initialClass)
  }, [initialClass])

  const getStudentClassId = student => {
    const mappedClass = STUDENT_CLASSES[Number(student.id)] || STUDENT_CLASSES[student.id]
    if (mappedClass) return mappedClass

    const explicitClassId = student.classId || student.class_id
    if (explicitClassId) return explicitClassId

    if (student.className) {
      const classMatch = CLASSES.find(cls => cls.name === student.className)
      return classMatch?.id || null
    }

    return null
  }

  const classStudents = selectedClass
    ? students.filter(s => getStudentClassId(s) === selectedClass)
    : students

  const present = classStudents.filter(s => s.status === 'present').length
  const absent = classStudents.filter(s => s.status === 'absent').length
  const late = classStudents.filter(s => s.status === 'late').length
  const inTherapy = classStudents.filter(s => s.status === 'therapy').length
  const withBT = classStudents.filter(s => s.status === 'with-bt').length
  const unknown = classStudents.filter(s => s.status === 'unknown').length

  async function quickPoints(id, amount) {
    playSound(amount > 0 ? 'positive' : 'negative')
    await recordStudentPointsAction({
      studentId: id,
      pointsDelta: amount,
      reminderDelta: amount < 0 ? 1 : 0,
      reason: amount > 0 ? `+${amount} pts` : `${amount} pts`,
      eventType: amount > 0 ? 'award' : 'deduction',
      category: 'teacher-dashboard',
      sourceContext: 'teacher-dashboard-quick-action',
    })
  }
  async function quickReminder(id) {
    playSound('negative')
    await recordStudentPointsAction({
      studentId: id,
      pointsDelta: 0,
      reminderDelta: 1,
      reason: 'Reminder',
      eventType: 'reminder',
      category: 'teacher-dashboard',
      sourceContext: 'teacher-dashboard-quick-action',
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>{classStudents.length} students</p>
      </div>

      {/* Class Selection */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>👨‍🏫 Which class are you teaching now?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {initialClass ? (
            (() => {
              const cls = CLASSES.find(c => c.id === initialClass)
              const count = students.filter(s => getStudentClassId(s) === initialClass).length
              const presentCount = students.filter(s => getStudentClassId(s) === initialClass && s.status === 'present').length
              return (
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '2px solid #4f6687',
                    background: '#4f6687',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                  disabled
                >
                  🏫 {cls?.name || 'Assigned Class'} ({presentCount}/{count})
                </button>
              )
            })()
          ) : (
            <>
              <button onClick={() => setSelectedClass(null)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedClass === null ? '#0f172a' : '#e5e7eb'}`, background: selectedClass === null ? '#0f172a' : '#fff', color: selectedClass === null ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                📚 All Classes ({students.length})
              </button>
              {CLASSES.map(cls => {
                const count = students.filter(s => getStudentClassId(s) === cls.id).length
                const presentCount = students.filter(s => getStudentClassId(s) === cls.id && s.status === 'present').length
                return (
                  <button key={cls.id} onClick={() => setSelectedClass(cls.id)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedClass === cls.id ? '#4f6687' : '#e5e7eb'}`, background: selectedClass === cls.id ? '#4f6687' : '#fff', color: selectedClass === cls.id ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    🏫 {cls.name} ({presentCount}/{count})
                  </button>
                )
              })}
            </>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('primary'), padding: '8px 20px', fontSize: 13 }}>▶ Start Class Session</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Present', present, '#4f6687', classStudents.filter(s=>s.status==='present')],
          ['Absent', absent, '#9f1239', classStudents.filter(s=>s.status==='absent')],
          ['Late', late, '#9a6a2a', classStudents.filter(s=>s.status==='late')],
          ['Therapy', inTherapy, '#6d28d9', classStudents.filter(s=>s.status==='therapy')],
          ['With BT', withBT, '#3f6b76', classStudents.filter(s=>s.status==='with-bt')],
          ['Unknown', unknown, '#9f1239', classStudents.filter(s=>s.status==='unknown')],
        ].map(([label, val, color, filtered]) => (
          <div key={label} onClick={() => (filtered as any[]).length > 0 && setDrillDown({ title: `${label}`, students: filtered as any[] })}
            style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0', textAlign: 'center', borderTop: `3px solid ${color}`, cursor: (filtered as any[]).length > 0 ? 'pointer' : 'default' }}
            onMouseEnter={e => { if ((filtered as any[]).length > 0) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Student cards */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 {selectedClass ? CLASSES.find(c=>c.id===selectedClass)?.name : 'All Students'} — Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {classStudents.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const vip = isVIP ? isVIP(s) : false
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : s.status === 'unknown' ? '#fef2f2' : '#ffffff', border: `1px solid ${vip ? '#ca8a04' : s.status === 'unknown' ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}{vip && ' ⭐'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span>
                      {withStaffObj && <span style={{ fontSize: 10, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#9f1239', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => quickPoints(s.id, 2)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#4b6854', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => quickPoints(s.id, 5)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#4b6854', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => quickPoints(s.id, 10)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#4b6854', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+10</button>
                  <button onClick={() => quickReminder(s.id)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#9f1239', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>Therapist Portal · Wednesday, June 4</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 My Students</div>
          {myStudents.map((s, i) => {
            const imp = getImprovement(s)
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div style={S.avatar(i, 36)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    <span style={{ fontSize: 11, color: imp.color, fontWeight: 600 }}>{imp.icon}</span>
                  </div>
                </div>
                <div>{s.services.map((svc, j) => <div key={j} style={{ fontSize: 11, color: '#5b5f7a', fontWeight: 600 }}>{svc.type}</div>)}</div>
              </div>
            )
          })}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 This Week's Sessions</div>
          {THERAPY_SCHEDULE_STATE.map((t, i) => {
            const staffMember = STAFF.find(st => st.id === t.staffId)
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

function StudentFlagsPanel({
  students,
  flags,
  setFlags,
  currentStaffName
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [expandedId, setExpandedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [observed, setObserved] = useState('yes')
  const [note, setNote] = useState('')
  const [staffName, setStaffName] = useState(currentStaffName || 'Staff Member')

  const studentName = id =>
    students.find(student => Number(student.id) === Number(id))?.name ||
    'Unknown Student'

  const normalizedFlags = flags.map(flag => ({
    ...flag,
    completed: flag.completed || flag.endDate < today
  }))

  const activeFlags = normalizedFlags
    .filter(flag => !flag.completed)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))

  const completedFlags = normalizedFlags
    .filter(flag => flag.completed)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))

  const createFlag = () => {
    if (!studentId || !goal.trim() || !startDate || !endDate) return
    if (endDate < startDate) {
      alert('End date must be on or after the start date.')
      return
    }

    setFlags(previous => [
      {
        id: `flag-${Date.now()}`,
        studentId: Number(studentId),
        goal: goal.trim(),
        startDate,
        endDate,
        createdBy: currentStaffName || 'Staff Member',
        createdAt: today,
        completed: endDate < today,
        observations: []
      },
      ...previous
    ])

    setGoal('')
    setStartDate(today)
    setEndDate('')
    setShowCreate(false)
  }

  const addObservation = flagId => {
    if (!staffName.trim()) return

    setFlags(previous =>
      previous.map(flag =>
        flag.id !== flagId
          ? flag
          : {
              ...flag,
              observations: [
                {
                  id: `observation-${Date.now()}`,
                  observed: observed === 'yes',
                  note: note.trim(),
                  staffName: staffName.trim(),
                  date: today,
                  time: new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })
                },
                ...(flag.observations || [])
              ]
            }
      )
    )

    setNote('')
    setObserved('yes')
  }

  const card = {
    background: '#ffffff',
    border: '1px solid #dfe6ee',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 4px 14px rgba(30,41,59,0.045)'
  }

  const input = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 9,
    border: '1px solid #d8e0e8',
    fontSize: 12,
    background: '#fff',
    boxSizing: 'border-box'
  }

  const renderFlag = (flag, completed = false) => {
    const isOpen = expandedId === flag.id
    const yesCount = (flag.observations || []).filter(item => item.observed).length
    const noCount = (flag.observations || []).filter(item => !item.observed).length

    return (
      <div key={flag.id} style={{
        ...card,
        opacity: completed ? 0.82 : 1,
        borderLeft: `4px solid ${completed ? '#94a3b8' : '#4f7092'}`
      }}>
        <button
          onClick={() => setExpandedId(isOpen ? null : flag.id)}
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 14,
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#24364b' }}>
                {studentName(flag.studentId)}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 750,
                color: '#40556d',
                marginTop: 5,
                lineHeight: 1.4
              }}>
                {flag.goal}
              </div>
              <div style={{ fontSize: 11, color: '#718096', marginTop: 7 }}>
                {flag.startDate} through {flag.endDate} · Created by {flag.createdBy}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{
                display: 'inline-flex',
                padding: '4px 8px',
                borderRadius: 999,
                background: completed ? '#eef1f4' : '#eaf2f8',
                color: completed ? '#64748b' : '#315f82',
                fontSize: 10,
                fontWeight: 850
              }}>
                {completed ? 'Completed' : 'Active'}
              </span>
              <div style={{ fontSize: 11, color: '#718096', marginTop: 8 }}>
                {yesCount} yes · {noCount} no · {(flag.observations || []).length} total
              </div>
            </div>
          </div>
        </button>

        {isOpen && (
          <div style={{
            marginTop: 15,
            paddingTop: 15,
            borderTop: '1px solid #e6ebf0'
          }}>
            {!completed && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px minmax(180px, 1fr) 190px auto',
                gap: 10,
                alignItems: 'end',
                background: '#f7f9fb',
                border: '1px solid #e3e8ee',
                borderRadius: 11,
                padding: 12,
                marginBottom: 14
              }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
                  Observed behavior?
                  <select
                    value={observed}
                    onChange={event => setObserved(event.target.value)}
                    style={{ ...input, marginTop: 5 }}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
                  Note
                  <input
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    placeholder="What did you notice?"
                    style={{ ...input, marginTop: 5 }}
                  />
                </label>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
                  Staff name
                  <input
                    value={staffName}
                    onChange={event => setStaffName(event.target.value)}
                    style={{ ...input, marginTop: 5 }}
                  />
                </label>

                <button
                  onClick={() => addObservation(flag.id)}
                  style={{
                    padding: '10px 13px',
                    borderRadius: 9,
                    border: '1px solid #315f82',
                    background: '#315f82',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 850,
                    cursor: 'pointer'
                  }}
                >
                  Log observation
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              {(flag.observations || []).length === 0 && (
                <div style={{ fontSize: 12, color: '#8491a0', padding: '8px 0' }}>
                  No observations logged yet.
                </div>
              )}

              {(flag.observations || []).map(item => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: 10,
                  alignItems: 'start',
                  padding: '10px 11px',
                  borderRadius: 9,
                  background: item.observed ? '#edf7f1' : '#fff3f3',
                  border: `1px solid ${item.observed ? '#cfe6d7' : '#f2d0d0'}`
                }}>
                  <b style={{
                    fontSize: 11,
                    color: item.observed ? '#397153' : '#a23a4c'
                  }}>
                    {item.observed ? 'YES' : 'NO'}
                  </b>
                  <div>
                    <div style={{ fontSize: 12, color: '#3d4f62' }}>
                      {item.note || 'No note entered.'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#718096', marginTop: 4 }}>
                      {item.staffName}
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: '#718096', textAlign: 'right' }}>
                    {item.date}<br />{item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 14,
        alignItems: 'center',
        marginBottom: 14
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#34465a' }}>
            Student Flags & Observations
          </div>
          <div style={{ fontSize: 12, color: '#778493', marginTop: 4 }}>
            Time-limited observation goals with simple staff check-ins.
          </div>
        </div>

        <button
          onClick={() => setShowCreate(value => !value)}
          style={{
            padding: '9px 13px',
            borderRadius: 9,
            border: '1px solid #315f82',
            background: '#315f82',
            color: '#fff',
            fontSize: 12,
            fontWeight: 850,
            cursor: 'pointer'
          }}
        >
          {showCreate ? 'Cancel' : '+ New Flag'}
        </button>
      </div>

      {showCreate && (
        <div style={{
          ...card,
          marginBottom: 16,
          background: '#f7f9fb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 160px 160px',
            gap: 11
          }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
              Student
              <select
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                style={{ ...input, marginTop: 5 }}
              >
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
              Goal / behavior to observe
              <input
                value={goal}
                onChange={event => setGoal(event.target.value)}
                placeholder="Example: Raises hand before speaking"
                style={{ ...input, marginTop: 5 }}
              />
            </label>

            <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
                style={{ ...input, marginTop: 5 }}
              />
            </label>

            <label style={{ fontSize: 11, fontWeight: 800, color: '#526274' }}>
              End date
              <input
                type="date"
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
                style={{ ...input, marginTop: 5 }}
              />
            </label>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12
          }}>
            <div style={{ fontSize: 11, color: '#718096' }}>
              Created by: <b>{currentStaffName || 'Staff Member'}</b>
            </div>
            <button
              onClick={createFlag}
              style={{
                padding: '9px 14px',
                borderRadius: 9,
                border: '1px solid #315f82',
                background: '#315f82',
                color: '#fff',
                fontSize: 11,
                fontWeight: 850,
                cursor: 'pointer'
              }}
            >
              Create flag
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 900,
            color: '#34465a',
            marginBottom: 9
          }}>
            Active ({activeFlags.length})
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {activeFlags.length
              ? activeFlags.map(flag => renderFlag(flag, false))
              : <div style={card}>No active flags.</div>}
          </div>
        </div>

        <details style={{ marginTop: 6 }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 900,
            color: '#526274',
            padding: '8px 0'
          }}>
            Completed ({completedFlags.length})
          </summary>
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {completedFlags.length
              ? completedFlags.map(flag => renderFlag(flag, true))
              : <div style={card}>No completed flags yet.</div>}
          </div>
        </details>
      </div>
    </div>
  )
}

function FlagDashboardWidget({ flags, onOpen }) {
  const today = new Date().toISOString().slice(0, 10)
  const inSevenDays = new Date()
  inSevenDays.setDate(inSevenDays.getDate() + 7)
  const sevenDayIso = inSevenDays.toISOString().slice(0, 10)

  const active = flags.filter(flag => !flag.completed && flag.endDate >= today)
  const dueSoon = active.filter(flag => flag.endDate <= sevenDayIso)
  const observationsToday = active.reduce(
    (sum, flag) =>
      sum + (flag.observations || []).filter(item => item.date === today).length,
    0
  )

  return (
    <div style={{
      marginTop: 16,
      paddingTop: 14,
      borderTop: '1px solid #eef0f7'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#263241'
          }}>
            Student Flags
          </div>

          <div style={{
            fontSize: 10.5,
            color: '#64748b',
            marginTop: 3
          }}>
            {active.length} active · {dueSoon.length} ending soon · {observationsToday} today
          </div>
        </div>

        <button
          onClick={onOpen}
          style={{
            border: '1px solid #cbd7e3',
            background: '#f8fafc',
            color: '#4f6687',
            borderRadius: 10,
            padding: '6px 9px',
            fontSize: 10.5,
            fontWeight: 750,
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          Open Flags
        </button>
      </div>
    </div>
  )
}



interface DashboardProps {
  teacherUser?: { role: string; name: string }
  onTeacherSessionLogout?: () => void
}

const AUTH_USER_STORAGE_KEY = 'schoolDashboardAuthUser'
const ATTENDANCE_RESET_STORAGE_KEY = 'schoolDashboardLastAttendanceResetDate'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function applyDailyAttendanceReset(studentsList, resetDate) {
  return studentsList.map(student => {
    const resetLogEntry = {
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type: 'day-reset',
      note: `Daily attendance reset for ${resetDate}`,
      staffId: null,
      staffName: 'System',
      recordedAt: new Date().toISOString(),
    }

    return {
      ...student,
      dailyStatus: 'not-arrived',
      status: 'not-arrived',
      withStaff: null,
      lateDetails: null,
      classLog: [...(student.classLog || []), resetLogEntry],
    }
  })
}

export default function Dashboard({ teacherUser, onTeacherSessionLogout }: DashboardProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('admin')
  const [userName, setUserName] = useState('')
  const [loggedInStaff, setLoggedInStaff] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [activeSessionIds, setActiveSessionIds] = useState<Record<number, number>>({})
  const [showStaffManagement, setShowStaffManagement] = useState(false)
  const [showStaffPanel, setShowStaffPanel] = useState(true)
  const [showLoginActivity, setShowLoginActivity] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [students, setStudents] = useState(() => initialStudents.slice())
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState(null)
  const [studentFallbackPatchCount, setStudentFallbackPatchCount] = useState(() => getStudentFallbackPatchCount())
  const [studentFallbackSyncState, setStudentFallbackSyncState] = useState('idle')
  const [staffMembers, setStaffMembers] = useState([])
  const [staffLoadError, setStaffLoadError] = useState(null)
  const fallbackSyncInFlightRef = useRef(false)

  const loadStoredConfig = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback

    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch (error) {
      console.warn(`Unable to load ${key}:`, error)
      return fallback
    }
  }

  const [schoolClasses, setSchoolClasses] = useState(() =>
    loadStoredConfig('school-dashboard-classes', CLASSES.map(cls => ({ ...cls })))
  )
  const [schoolDivisions, setSchoolDivisions] = useState(() =>
    loadStoredConfig('school-dashboard-divisions', Object.fromEntries(
      Object.entries(DIVISIONS).map(([key, value]) => [key, { ...value }])
    ))
  )
  const [showClassEditor, setShowClassEditor] = useState(false)
  const [showDivisionEditor, setShowDivisionEditor] = useState(false)
  const [classForm, setClassForm] = useState({
    id: '',
    name: '',
    grade: '',
    teacher: '',
    divisionKey: Object.keys(DIVISIONS)[0] || 'mesivta',
  })
  const [divisionForm, setDivisionForm] = useState({
    key: '',
    label: '',
    shortLabel: '',
  })
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingDivisionKey, setEditingDivisionKey] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('school-dashboard-classes', JSON.stringify(schoolClasses))
      window.localStorage.setItem('school-dashboard-divisions', JSON.stringify(schoolDivisions))
    }

    CLASSES.splice(0, CLASSES.length, ...schoolClasses.map(cls => ({ ...cls })))

    Object.keys(DIVISIONS).forEach(key => delete DIVISIONS[key])
    Object.entries(schoolDivisions).forEach(([key, value]) => {
      DIVISIONS[key] = { ...(value as { label: string; shortLabel: string }) }
    })

    Object.keys(CLASS_DIVISION).forEach(key => delete CLASS_DIVISION[key])
    schoolClasses.forEach(cls => {
      const divisionKey = cls.divisionKey || Object.keys(schoolDivisions)[0] || 'mesivta'
      CLASS_DIVISION[cls.id] = divisionKey
    })
  }, [schoolClasses, schoolDivisions])

  const resetClassForm = () => {
    setClassForm({
      id: '',
      name: '',
      grade: '',
      teacher: '',
      divisionKey: Object.keys(schoolDivisions)[0] || 'mesivta',
    })
    setEditingClassId(null)
    setShowClassEditor(true)
  }

  const startEditClass = (cls) => {
    setEditingClassId(cls.id)
    setClassForm({
      id: cls.id,
      name: cls.name,
      grade: cls.grade || '',
      teacher: cls.teacher || '',
      divisionKey: cls.divisionKey || Object.keys(schoolDivisions)[0] || 'mesivta',
    })
    setShowClassEditor(true)
  }

  const handleSaveClass = (event) => {
    event.preventDefault()

    const name = classForm.name.trim()
    const grade = classForm.grade.trim()
    const teacher = classForm.teacher.trim()
    const divisionKey = classForm.divisionKey || Object.keys(schoolDivisions)[0] || 'mesivta'

    if (!name || !grade) return

    if (editingClassId) {
      setSchoolClasses(previous =>
        previous.map(item =>
          item.id === editingClassId
            ? { ...item, name, grade, teacher, divisionKey }
            : item
        )
      )
    } else {
      setSchoolClasses(previous => [
        ...previous,
        {
          id: `class-${Date.now()}`,
          name,
          grade,
          teacher,
          divisionKey,
        },
      ])
    }

    setShowClassEditor(false)
    setEditingClassId(null)
    setClassForm({
      id: '',
      name: '',
      grade: '',
      teacher: '',
      divisionKey: Object.keys(schoolDivisions)[0] || 'mesivta',
    })
  }

  const resetDivisionForm = () => {
    setDivisionForm({ key: '', label: '', shortLabel: '' })
    setEditingDivisionKey(null)
    setShowDivisionEditor(true)
  }

  const startEditDivision = (key, value) => {
    setEditingDivisionKey(key)
    setDivisionForm({ key, label: value.label, shortLabel: value.shortLabel })
    setShowDivisionEditor(true)
  }

  const handleSaveDivision = (event) => {
    event.preventDefault()

    const label = divisionForm.label.trim()
    const shortLabel = divisionForm.shortLabel.trim()
    const key = divisionForm.key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    if (!key || !label || !shortLabel) return

    setSchoolDivisions(previous => {
      const next = { ...previous }
      if (editingDivisionKey && editingDivisionKey !== key) {
        delete next[editingDivisionKey]
      }
      next[key] = { label, shortLabel }
      return next
    })

    setShowDivisionEditor(false)
    setEditingDivisionKey(null)
    setDivisionForm({ key: '', label: '', shortLabel: '' })
  }

  const refreshStaffMembers = useCallback(async () => {
    try {
      setStaffLoadError(null)
      const members = await loadStaffMembers()
      setStaffMembers(Array.isArray(members) ? members : [])
    } catch (error) {
      console.error('Unable to load staff members:', error)
      setStaffLoadError('Unable to load staff members.')
      setStaffMembers([])
    }
  }, [])

  // Auto-login with teacher portal user info
  useEffect(() => {
    if (teacherUser && !loggedIn) {
      handleLogin(teacherUser.role, teacherUser.name)
    }
  }, [teacherUser])

  useEffect(() => {
    refreshStaffMembers()
  }, [refreshStaffMembers])

  useEffect(() => {
    const refreshFallbackCount = () => {
      setStudentFallbackPatchCount(getStudentFallbackPatchCount())
    }

    refreshFallbackCount()

    const intervalId = window.setInterval(refreshFallbackCount, 3000)
    window.addEventListener('storage', refreshFallbackCount)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('storage', refreshFallbackCount)
    }
  }, [])

  const flushStudentFallbackPatches = useCallback(async () => {
    if (fallbackSyncInFlightRef.current) return

    const patches = readStudentFallbackPatches()
    const patchEntries = Object.entries(patches)

    if (patchEntries.length === 0) {
      setStudentFallbackPatchCount(0)
      setStudentFallbackSyncState('idle')
      return
    }

    fallbackSyncInFlightRef.current = true
    setStudentFallbackSyncState('syncing')

    let hadFailure = false

    try {
      for (const [studentId, patch] of patchEntries) {
        const { _savedAt, ...fields } = patch || {}

        if (Object.keys(fields).length === 0) {
          clearStudentFallbackPatch(studentId)
          continue
        }

        const saved = await persistStudentFields(studentId, fields, { allowFallback: false })
        if (!saved) {
          hadFailure = true
        }
      }
    } finally {
      fallbackSyncInFlightRef.current = false
      const remaining = getStudentFallbackPatchCount()
      setStudentFallbackPatchCount(remaining)
      setStudentFallbackSyncState(remaining === 0 ? 'idle' : hadFailure ? 'error' : 'idle')
    }
  }, [])

  useEffect(() => {
    if (studentFallbackPatchCount === 0) return

    flushStudentFallbackPatches()

    const intervalId = window.setInterval(() => {
      flushStudentFallbackPatches()
    }, 15000)

    const handleOnline = () => {
      flushStudentFallbackPatches()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
    }
  }, [studentFallbackPatchCount, flushStudentFallbackPatches])

  const STAFF = useMemo(
    () =>
      (staffMembers || [])
        .filter(member => member.active)
        .map(member => ({
          id: String(member.id),
          name: member.name,
          role: member.role,
          roles: member.roles || [],
          email: member.email || '',
          phone: member.phone || '',
          active: member.active,
        })),
    [staffMembers],
  )

  const TEACHING_STAFF_OPTIONS = useMemo(
    () => getStaffNameOptions(STAFF, role => /teacher|rebbe/i.test(role)),
    [STAFF],
  )

  const TOUR_STAFF_OPTIONS = useMemo(
    () => getStaffNameOptions(STAFF, role => /admin|menahel|teacher|rebbe/i.test(role)),
    [STAFF],
  )

  const THERAPIST_OPTIONS = useMemo(() => {
    const specialtyForMember = member => {
      const roleText = [member.role, ...(member.roles || [])].join(' ').toLowerCase()
      if (roleText.includes('speech')) return 'Speech'
      if (roleText.includes('ot')) return 'OT'
      if (roleText.includes('pt')) return 'PT'
      if (roleText.includes('bcba')) return 'BCBA'
      if (roleText.includes('social-counseling') || roleText.includes('social counseling')) return 'Social Counseling'
      if (roleText.includes('bt')) return 'BT'
      return 'Therapist'
    }

    return STAFF
      .filter(member =>
        staffMatchesAnyRole(member, /therapist|speech|ot|pt|bcba|social-counseling|bt/i),
      )
      .map(member => ({
        name: member.name,
        email: member.email || '',
        specialty: specialtyForMember(member),
      }))
  }, [STAFF])

  const SUPPORT_STAFF_OPTIONS = useMemo(() => {
    const entries = []
    const seen = new Set()

    const roleMap = [
      { matcher: /bt/i, staffType: 'BT', service: 'BT Support' },
      { matcher: /social-counseling|social counseling|counsel/i, staffType: 'Social Counseling', service: 'Social Counseling' },
      { matcher: /speech/i, staffType: 'Speech', service: 'Speech' },
      { matcher: /\bot\b/i, staffType: 'OT', service: 'OT' },
      { matcher: /\bpt\b/i, staffType: 'PT', service: 'PT' },
      { matcher: /bcba/i, staffType: 'BCBA', service: 'BCBA Observation' },
      { matcher: /therapist/i, staffType: 'Therapist', service: 'Therapy' },
      { matcher: /teacher|rebbe|admin|menahel|sgan|mashgiach/i, staffType: 'General Staff', service: 'Therapy' },
    ]

    STAFF.forEach(member => {
      const roleText = [member.role, ...(member.roles || [])].join(' ').toLowerCase()

      roleMap.forEach(config => {
        if (!config.matcher.test(roleText)) return

        const key = `${member.name}|${config.staffType}|${config.service}`
        if (seen.has(key)) return
        seen.add(key)

        entries.push({
          name: member.name,
          staffType: config.staffType,
          service: config.service,
        })
      })
    })

    return entries
  }, [STAFF])

  const SETUP_PEOPLE = useMemo(
    () => {
      const byName = new Map()

      STAFF.forEach(person => {
        if (staffMatchesAnyRole(person, /teacher|rebbe|menahel|sgan|mashgiach/i)) {
          byName.set(person.name, {
            id: person.id,
            name: person.name,
            type: 'teacher',
            specialty: person.role,
          })
        }
      })

      SUPPORT_STAFF_OPTIONS.forEach((person, index) => {
        if (byName.has(person.name)) return

        byName.set(person.name, {
          id: `support-${index + 1}`,
          name: person.name,
          type: 'support',
          specialty: person.staffType,
          service: person.service,
        })
      })

      return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name))
    },
    [STAFF, SUPPORT_STAFF_OPTIONS],
  )

  useEffect(() => {
    async function loadStudents() {
      setStudentLoadError(null)

      console.log('Loading students from Supabase...')

      const { data: existingRows, error: loadError } = await supabase
        .from('students')
        .select('*')

      if (loadError) {
        console.error('Supabase load students error:', loadError)
        setStudentLoadError(
          loadError.message || 'Unable to load student data.'
        )
        return
      }

      const currentRows = existingRows || []

      console.log('Current Supabase student count:', currentRows.length)

      const existingIds = new Set(
        currentRows.map(student => Number(student.id))
      )

      const missingStudents = initialStudents.filter(
        student => !existingIds.has(Number(student.id))
      )

      console.log('Missing student count:', missingStudents.length)

      if (missingStudents.length > 0) {
        /*
         * Insert only the basic columns first.
         * The full rich demo objects remain in initialStudents and are
         * merged back into the loaded rows below.
         */
        const seedRows = missingStudents.map(student => ({
          id: student.id,
          name: student.name,
          status: student.status
        }))

        const { error: insertError } = await supabase
          .from('students')
          .upsert(seedRows, {
            onConflict: 'id',
            ignoreDuplicates: true
          })

        if (insertError) {
          console.error('Supabase insert missing students error:', insertError)
          setStudentLoadError(
            insertError.message || 'Unable to add missing students.'
          )
          return
        }

        console.log('Inserted student count:', seedRows.length)
      }

      const { data: finalRows, error: finalLoadError } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (finalLoadError) {
        console.error(
          'Supabase final student load error:',
          finalLoadError
        )
        setStudentLoadError(
          finalLoadError.message || 'Unable to reload student data.'
        )
        return
      }

      const databaseRows = finalRows || []
      if (databaseRows.length === 0) {
        const resetDate = todayIsoDate()
        const lastResetDate = localStorage.getItem(
          ATTENDANCE_RESET_STORAGE_KEY
        )

        if (lastResetDate !== resetDate) {
          const resetStudents = applyDailyAttendanceReset(
            initialStudents,
            resetDate
          )
          setStudents(resetStudents)
          localStorage.setItem(
            ATTENDANCE_RESET_STORAGE_KEY,
            resetDate
          )
        }

        setStudentsLoaded(true)
        return
      }

      /*
       * Keep all existing rich fields from initialStudents, while allowing
       * saved Supabase values such as status to override them.
       */
      const initialById = new Map(
        initialStudents.map(student => [Number(student.id), student])
      )

      const mergedStudents = databaseRows.map(databaseStudent => {
        const initialStudent = initialById.get(
          Number(databaseStudent.id)
        )

        const merged = initialStudent
          ? { ...initialStudent, ...databaseStudent }
          : {
              points: 0,
              reminders: 0,
              status: 'present',
              dailyStatus:
                databaseStudent.dailyStatus ||
                databaseStudent.status ||
                'present',
              withStaff: null,
              att: [],
              breakfast: [],
              services: [],
              parentCalls: [],
              notes: [],
              behaviorLog: [],
              testScores: [],
              classLog: [],
              lateDetails: null,
              family: {},
              medical: {},
              ...databaseStudent
            }

        merged.dailyStatus =
          databaseStudent.daily_status ||
          databaseStudent.dailyStatus ||
          databaseStudent.status ||
          merged.dailyStatus ||
          merged.status ||
          'present'

        merged.withStaff =
          databaseStudent.with_staff ??
          databaseStudent.withStaff ??
          merged.withStaff ??
          null

        merged.lateDetails =
          databaseStudent.late_details ??
          databaseStudent.lateDetails ??
          merged.lateDetails ??
          null

        const persistedPoints = databaseStudent.token_balance

        if (persistedPoints !== null && persistedPoints !== undefined) {
          merged.points = Number(persistedPoints) || 0
        }

        // Load persisted JSONB fields from database, fallback to demo data if empty
        if (databaseStudent.attendance && Array.isArray(databaseStudent.attendance) && databaseStudent.attendance.length > 0) {
          merged.att = databaseStudent.attendance
        }
        if (databaseStudent.notes && Array.isArray(databaseStudent.notes) && databaseStudent.notes.length > 0) {
          merged.notes = databaseStudent.notes
        }
        if (databaseStudent.behavior_log && Array.isArray(databaseStudent.behavior_log) && databaseStudent.behavior_log.length > 0) {
          merged.behaviorLog = databaseStudent.behavior_log
        }
        if (databaseStudent.medical && typeof databaseStudent.medical === 'object' && Object.keys(databaseStudent.medical).length > 0) {
          merged.medical = databaseStudent.medical
        }
        if (databaseStudent.family && typeof databaseStudent.family === 'object' && Object.keys(databaseStudent.family).length > 0) {
          merged.family = databaseStudent.family
        }
        if (databaseStudent.parent_calls && Array.isArray(databaseStudent.parent_calls) && databaseStudent.parent_calls.length > 0) {
          merged.parentCalls = databaseStudent.parent_calls
        }
        if (typeof databaseStudent.reminders === 'number') {
          merged.reminders = databaseStudent.reminders
        }
        if (databaseStudent.test_scores && Array.isArray(databaseStudent.test_scores) && databaseStudent.test_scores.length > 0) {
          merged.testScores = databaseStudent.test_scores
        }
        if (databaseStudent.class_log && Array.isArray(databaseStudent.class_log) && databaseStudent.class_log.length > 0) {
          merged.classLog = databaseStudent.class_log
        }

        return merged
      })

      const fallbackPatches = readStudentFallbackPatches()
      const mergedWithFallback = mergedStudents.map(student => {
        const patch = fallbackPatches[String(student.id)]
        return patch ? { ...student, ...patch } : student
      })

      const resetDate = todayIsoDate()
      const lastResetDate = localStorage.getItem(
        ATTENDANCE_RESET_STORAGE_KEY
      )
      const shouldResetAttendance = lastResetDate !== resetDate

      const studentsAfterDailyReset = shouldResetAttendance
        ? applyDailyAttendanceReset(mergedWithFallback, resetDate)
        : mergedWithFallback

      if (shouldResetAttendance) {
        const resetSaveResults = await Promise.all(
          studentsAfterDailyReset.map(student =>
            persistStudentFields(student.id, {
              dailyStatus: student.dailyStatus,
              status: student.status,
              withStaff: student.withStaff,
              lateDetails: student.lateDetails,
              classLog: student.classLog,
            })
          )
        )

        if (resetSaveResults.every(Boolean)) {
          localStorage.setItem(
            ATTENDANCE_RESET_STORAGE_KEY,
            resetDate
          )
        } else {
          console.error('Daily attendance reset failed for one or more students.')
        }
      }

      console.log('Final student count:', studentsAfterDailyReset.length)

      setStudents(studentsAfterDailyReset)
      setStudentsLoaded(true)
    }

    loadStudents()
  }, [])

  const [studentFlags, setStudentFlags] = useState(() => [
      {
        id: 'flag-demo-1',
        studentId: 16,
        goal: 'Uses an appropriate break request before leaving his seat',
        startDate: '2026-06-18',
        endDate: '2026-06-30',
        createdBy: 'Rabbi Baum',
        createdAt: '2026-06-18',
        completed: false,
        observations: []
      },
      {
        id: 'flag-demo-2',
        studentId: 11,
        goal: 'Begins assigned work within three minutes',
        startDate: '2026-06-17',
        endDate: '2026-06-26',
        createdBy: 'Rabbi Klein',
        createdAt: '2026-06-17',
        completed: false,
        observations: [
          {
            id: 'flag-demo-observation-1',
            observed: true,
            note: 'Started independently after one reminder.',
            staffName: 'Rabbi Klein',
            date: '2026-06-18',
            time: '10:14 AM'
          }
        ]
      }
    ])
  const [studentFlagsLoaded, setStudentFlagsLoaded] = useState(false)
  const [studentFlagsPersistenceReady, setStudentFlagsPersistenceReady] = useState(false)
  const [supportInitialSection, setSupportInitialSection] = useState('overview')

  useEffect(() => {
    let active = true

    async function loadStudentFlags() {
      try {
        const flags = await listStudentFlags()
        if (active && flags.length > 0) {
          setStudentFlags(flags)
        }
        if (active) {
          setStudentFlagsPersistenceReady(true)
        }
      } catch (error) {
        console.error('Unable to load student flags from Supabase:', error)
        if (active) {
          setStudentFlagsPersistenceReady(false)
        }
      } finally {
        if (active) {
          setStudentFlagsLoaded(true)
        }
      }
    }

    loadStudentFlags()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!studentFlagsLoaded || !studentFlagsPersistenceReady) return

    replaceStudentFlags(studentFlags).catch(error => {
      console.error('Unable to save student flags to Supabase:', error)
    })
  }, [studentFlags, studentFlagsLoaded, studentFlagsPersistenceReady])

  useEffect(() => {
    if (!studentsLoaded) return

    async function loadStudentNotes() {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading student notes:', error)
        return
      }

      setStudents(prev =>
        prev.map(student => {
          const savedNotes = (data || [])
            .filter(note => Number(note.student_id) === Number(student.id))
            .map(note => ({
              date: note.created_at
                ? note.created_at.slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              author: note.author || 'Staff',
              text: note.note,
            }))

          const existingNotes = student.notes || []
          const savedKeys = new Set(
            savedNotes.map(note =>
              `${note.date}|${note.author}|${note.text}`
            )
          )

          const uniqueExistingNotes = existingNotes.filter(
            note =>
              !savedKeys.has(
                `${note.date}|${note.author}|${note.text}`
              )
          )

          return {
            ...student,
            notes: [...uniqueExistingNotes, ...savedNotes],
          }
        })
      )
    }

    loadStudentNotes()
  }, [studentsLoaded])

  const [attendanceReportOpen, setAttendanceReportOpen] = useState(false)
  const [attendanceReportView, setAttendanceReportView] = useState('today')
  const [attendanceReportDivision, setAttendanceReportDivision] = useState('all')
  const [attendanceReportClass, setAttendanceReportClass] = useState('all')
  const [attendanceReportStatus, setAttendanceReportStatus] = useState('all')
  const [attendanceReportStudentId, setAttendanceReportStudentId] = useState('all')
  const [attendanceReportSearch, setAttendanceReportSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentTab, setSelectedStudentTab] = useState('overview')
  const [selectedStudentPointsEvents, setSelectedStudentPointsEvents] = useState([])
  const [storeStudent, setStoreStudent] = useState(null)
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('all')
  const [storeItemSearch, setStoreItemSearch] = useState('')
  const [storeItems, setStoreItems] = useState(() => STORE_ITEMS.slice())
  const [purchaseLog, setPurchaseLog] = useState([])
  const [storePersistenceReady, setStorePersistenceReady] = useState(false)
  const [storeSyncState, setStoreSyncState] = useState('loading')
  const [storeLastLoadError, setStoreLastLoadError] = useState('')
  const [showStoreManager, setShowStoreManager] = useState(false)
  const [newStoreItem, setNewStoreItem] = useState({ name: '', cost: '', stock: '', lowStockAt: '5', emoji: '', category: 'nosh', vip: false })
  const [attFilter, setAttFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [teachingMode, setTeachingMode] = useState(false)
  const [teacherClass, setTeacherClass] = useState(null)
  const [teacherClassIds, setTeacherClassIds] = useState([])
  const [divisionView, setDivisionView] = useState('all')
  const [drillDown, setDrillDown] = useState(null)
  const [showUnknownPopup, setShowUnknownPopup] = useState(false)
  const [unknownNotes, setUnknownNotes] = useState({})

  // Open a student profile with optional tab
  const openStudent = (student, tab = 'overview') => {
    const isTeacherPortalRole = role === 'teacher' || role === 'rebbe'

    if (isTeacherPortalRole) {
      const targetStudentId = Number(student?.id)
      const directAssignedIds = getTeacherAssignedStudentIds(userName, setupAssignments)

      if (directAssignedIds.length > 0) {
        if (!directAssignedIds.includes(targetStudentId)) {
          alert('You can only open student profiles assigned to your roster.')
          return
        }
      } else {
        const assignedClassIds = getTeacherAssignedClassIds(userName, setupAssignments, students)
        const fallbackClassId = teacherClass || TEACHER_CLASS_MAP[userName] || null
        const allowedClassIds = assignedClassIds.length > 0
          ? assignedClassIds
          : (fallbackClassId ? [fallbackClassId] : [])

        if (allowedClassIds.length > 0) {
          const studentClassId = resolveStudentClassId(student)
          if (!studentClassId || !allowedClassIds.includes(studentClassId)) {
            alert('You can only open student profiles assigned to your class roster.')
            return
          }
        }
      }
    }

    setSelectedStudent(student)
    if (tab) setSelectedStudentTab(tab)
  }

  useEffect(() => {
    let active = true

    async function loadStoreData() {
      try {
        setStoreSyncState('loading')
        setStoreLastLoadError('')

        let loadedItems = await listStoreItems()

        if (loadedItems.length === 0) {
          await seedStoreItems(STORE_ITEMS)
          loadedItems = await listStoreItems()
        }

        const loadedRedemptions = await listStoreRedemptions(25)

        if (!active) return

        setStoreItems(loadedItems.length > 0 ? loadedItems : STORE_ITEMS.slice())
        setPurchaseLog(
          loadedRedemptions.map(redemption => ({
            id: redemption.id,
            time: new Date(redemption.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            studentId: redemption.studentId,
            studentName: redemption.studentName,
            itemName: redemption.itemName,
            cost: redemption.cost,
            staff: redemption.staffName,
            division: String(redemption.metadata?.division || ''),
          })),
        )
        setStorePersistenceReady(true)
        setStoreSyncState('ready')
      } catch (error) {
        console.error('Unable to load token store data from Supabase:', error)
        if (active) {
          setStorePersistenceReady(false)
          setStoreSyncState('error')
          setStoreLastLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load token store data from Supabase.',
          )
        }
      }
    }

    loadStoreData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedStudentPointsEvents() {
      if (!selectedStudent?.id) {
        setSelectedStudentPointsEvents([])
        return
      }

      try {
        const events = await listPointsEventsForStudent(Number(selectedStudent.id))
        if (!cancelled) {
          setSelectedStudentPointsEvents(events)
        }
      } catch (error) {
        console.error('Unable to load student points history:', error)
        if (!cancelled) {
          setSelectedStudentPointsEvents([])
        }
      }
    }

    loadSelectedStudentPointsEvents()

    return () => {
      cancelled = true
    }
  }, [selectedStudent])

  useEffect(() => {
    let active = true

    async function loadTodosData() {
      try {
        setTodoLoadError(null)
        const loadedTodos = await listTodos()
        if (active) {
          setTodos(loadedTodos)
        }
      } catch (error) {
        console.error('Unable to load todos from Supabase:', error)
        if (active) {
          setTodoLoadError(
            error instanceof Error ? error.message : 'Unable to load todos.'
          )
        }
      } finally {
        if (active) {
          setTodosLoaded(true)
        }
      }
    }

    loadTodosData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSetupData() {
      try {
        const [actions, vipRules, sales, assignments, schedule, accounts] = await Promise.all([
          listTeachingActions(),
          getVIPRules(),
          listStoreSales(),
          loadSetupAssignments(),
          loadTherapySchedule(),
          loadStaffAccounts(),
        ])

        if (active) {
          setSetupCustomActions(actions)
          setSetupVipRules({
            minimumPoints: vipRules.minimum_points,
            maximumReminders: vipRules.maximum_reminders,
            minimumAttendance: vipRules.minimum_attendance,
            requireAll: vipRules.require_all,
          })
          setSetupSales(sales)
          setSetupAssignments(prev => ({ ...prev, ...assignments }))
          setTHERAPY_SCHEDULE(schedule.length > 0 ? schedule : prev => prev)
          setSetupAccounts(accounts)
        }
      } catch (error) {
        console.error('Unable to load setup center config from Supabase:', error)
        // Keep defaults if load fails
      } finally {
        if (active) {
          setSetupCustomActionsLoaded(true)
          setSetupVipRulesLoaded(true)
          setSetupSalesLoaded(true)
        }
      }
    }

    loadSetupData()

    return () => {
      active = false
    }
  }, [])

  const [setupTab, setSetupTab] = useState('assignments')
  const [setupAssignmentError, setSetupAssignmentError] = useState(null)
  const [setupPerson, setSetupPerson] = useState('Rabbi Klein')
  const [setupAssignments, setSetupAssignments] = useState(() => {
    const assignments = {}

    SETUP_PEOPLE.forEach(person => {
      assignments[person.name] = {
        periods: {
          1: [],
          2: [],
          3: []
        },
        caseload: []
      }
    })

    // Pre-fill teacher rosters from each student's current class.
    initialStudents.forEach(student => {
      const classId = STUDENT_CLASSES[student.id]
      const classInfo = CLASSES.find(cls => cls.id === classId)

      if (classInfo?.teacher && assignments[classInfo.teacher]) {
        assignments[classInfo.teacher].periods = {
          1: [
            ...assignments[classInfo.teacher].periods[1],
            student.id
          ],
          2: [
            ...assignments[classInfo.teacher].periods[2],
            student.id
          ],
          3: [
            ...assignments[classInfo.teacher].periods[3],
            student.id
          ]
        }
      }
    })

    const btNames = [
      'Ezriel',
      'Tuli',
      'Avrumi',
      'Eliyahu',
      'Yaakov',
      'Elan',
      'Nussi'
    ]

    const btBcbaMap = {
      Ezriel: 'Mrs. Bloom',
      Tuli: 'Mrs. Bloom',
      Avrumi: 'Mrs. Bloom',
      Eliyahu: 'Mrs. Lev',
      Yaakov: 'Mrs. Lev',
      Elan: 'Mr. Moshe Gross',
      Nussi: 'Mr. Moshe Gross'
    }

    const socialNames = [
      'Shelly Wagschal',
      'Yechiel Feyershtien'
    ]

    initialStudents.forEach((student, index) => {
      const btName = btNames[index % btNames.length]
      const bcbaName = btBcbaMap[btName]
      const socialName = socialNames[index % socialNames.length]

      const assignSupportStudent = staffName => {
        if (!assignments[staffName]) return

        assignments[staffName].caseload = [
          ...assignments[staffName].caseload,
          student.id
        ]
      }

      // Daily BT and supervising BCBA.
      assignSupportStudent(btName)
      assignSupportStudent(bcbaName)

      // Weekly support services.
      assignSupportStudent(socialName)
      assignSupportStudent('Tzvi Malks')
      assignSupportStudent('Yitzi Liebowitz')
      assignSupportStudent('Aryeh Schechter')
    })

    return assignments
  })
  const [setupPersonSearch, setSetupPersonSearch] = useState('')
  const [setupStudentSearch, setSetupStudentSearch] = useState('')

  const [setupCustomActions, setSetupCustomActions] = useState([])
  const [setupCustomActionsLoaded, setSetupCustomActionsLoaded] = useState(false)

  const [setupActionDraft, setSetupActionDraft] = useState({
    label: '',
    points: 1,
    category: 'Praise'
  })

  const [setupVipRules, setSetupVipRules] = useState({
    minimumPoints: 80,
    maximumReminders: 2,
    minimumAttendance: 90,
    requireAll: true
  })
  const [setupVipRulesLoaded, setSetupVipRulesLoaded] = useState(false)

  const checkIsVIP = (s: any) => isVIP(s, setupVipRules)

  const [setupSales, setSetupSales] = useState([])
  const [setupSalesLoaded, setSetupSalesLoaded] = useState(false)

  const [setupSaleDraft, setSetupSaleDraft] = useState({
    name: '',
    type: 'points-off',
    value: 5
  })

  const [setupAccounts, setSetupAccounts] = useState({})

  const [THERAPY_SCHEDULE_STATE, setTHERAPY_SCHEDULE] = useState(THERAPY_SCHEDULE)

  useEffect(() => {
    if (role !== 'teacher' && role !== 'rebbe') return
    if (!userName) return

    const classIds = getTeacherAssignedClassIds(userName, setupAssignments, students)
    setTeacherClassIds(classIds)
    setTeacherClass(classIds[0] || TEACHER_CLASS_MAP[userName] || null)
  }, [role, userName, setupAssignments, students])

  // Persist staff accounts changes
  useEffect(() => {
    const persistAllAccounts = async () => {
      for (const [staffName, accountData] of Object.entries(setupAccounts)) {
        if (accountData && (accountData.active !== undefined || accountData.divisions)) {
          await saveStaffAccount(staffName, accountData)
        }
      }
    }
    
    if (Object.keys(setupAccounts).length > 0) {
      persistAllAccounts()
    }
  }, [setupAccounts])

  const createFakeTherapySchedule = () => {
    // Demo scheduling runs Monday through Thursday only.
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']

    const btNames = [
      'Ezriel',
      'Tuli',
      'Avrumi',
      'Eliyahu',
      'Yaakov',
      'Elan',
      'Nussi'
    ]

    // Each BT works under one BCBA.
    const btBcbaMap = {
      Ezriel: 'Mrs. Bloom',
      Tuli: 'Mrs. Bloom',
      Avrumi: 'Mrs. Bloom',
      Eliyahu: 'Mrs. Lev',
      Yaakov: 'Mrs. Lev',
      Elan: 'Mr. Moshe Gross',
      Nussi: 'Mr. Moshe Gross'
    }

    const socialNames = [
      'Shelly Wagschal',
      'Yechiel Feyershtien'
    ]

    const supportTimes = [
      '9:15 AM',
      '9:50 AM',
      '10:25 AM',
      '11:20 AM',
      '11:55 AM',
      '12:30 PM',
      '1:45 PM',
      '2:20 PM',
      '2:55 PM'
    ]

    const specialtyTimes = [
      '9:15 AM',
      '9:50 AM',
      '10:25 AM',
      '11:20 AM',
      '11:55 AM',
      '12:30 PM',
      '1:45 PM',
      '2:20 PM'
    ]

    const rows = []
    let counter = 0

    const timeToMinutes = value => {
      const match = value.match(/(\\d+):(\\d+)\\s*(AM|PM)/i)
      if (!match) return 0

      let hour = Number(match[1])
      const minute = Number(match[2])
      const period = match[3].toUpperCase()

      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0

      return hour * 60 + minute
    }

    const minutesToTime = value => {
      const total = value % (24 * 60)
      let hour = Math.floor(total / 60)
      const minute = total % 60
      const period = hour >= 12 ? 'PM' : 'AM'

      hour %= 12
      if (hour === 0) hour = 12

      return `${hour}:${String(minute).padStart(2, '0')} ${period}`
    }

    const missedClassForTime = (time, classInfo) => {
      const minutes = timeToMinutes(time)

      if (minutes >= 825 && minutes < 885) {
        return {
          subject: 'Math',
          teacher: 'Rabbi Altshull'
        }
      }

      if (minutes >= 885) {
        return {
          subject: 'English / Afternoon Class',
          teacher: classInfo?.teacher || 'Afternoon Teacher'
        }
      }

      if (minutes >= 750 && minutes < 825) {
        return {
          subject: 'Lunch / Recess',
          teacher: 'Lunch Staff'
        }
      }

      if (minutes >= 680 && minutes < 750) {
        return {
          subject: 'Morning Period 2',
          teacher: classInfo?.teacher || 'Morning Teacher'
        }
      }

      return {
        subject: 'Morning Period 1',
        teacher: classInfo?.teacher || 'Morning Teacher'
      }
    }

    const addRow = ({
      student,
      staffName,
      staffType,
      service,
      day,
      time,
      duration,
      frequency,
      location,
      supervisingBcba = '',
      note = ''
    }) => {
      const classId = STUDENT_CLASSES[student.id]
      const classInfo = CLASSES.find(cls => cls.id === classId)
      const missed = missedClassForTime(time, classInfo)

      rows.push({
        id: `support-slot-${Date.now()}-${counter++}`,
        studentId: student.id,
        therapistName: staffName,
        staffType,
        day,
        time,
        endTime: minutesToTime(timeToMinutes(time) + duration),
        duration,
        service,
        frequency,
        location,
        supervisingBcba,
        teacherName: missed.teacher,
        missedSubject: missed.subject,
        classId: classId || '',
        className: classInfo?.name || 'Unassigned Class',
        division: CLASS_DIVISION[classId] || 'mesivta',
        note
      })
    }

    /*
     * Permanent demo caseloads:
     * each student keeps the same primary BT and supervising BCBA.
     */
    initialStudents.forEach((student, studentIndex) => {
      const assignedBt = btNames[studentIndex % btNames.length]
      const assignedBcba = btBcbaMap[assignedBt]
      const btCaseloadPosition = Math.floor(studentIndex / btNames.length)

      // Daily BT support, Monday through Thursday.
      days.forEach((day, dayIndex) => {
        addRow({
          student,
          staffName: assignedBt,
          staffType: 'BT',
          service: 'Daily BT Support',
          day,
          time:
            supportTimes[
              (btCaseloadPosition * 2 + dayIndex) %
                supportTimes.length
            ],
          duration: 30,
          frequency: 'Monday–Thursday',
          location: 'Classroom / Support Room',
          supervisingBcba: assignedBcba,
          note:
            `Primary BT: ${assignedBt}. Supervising BCBA: ${assignedBcba}.`
        })
      })

      // Weekly Social Counseling for every demo student.
      addRow({
        student,
        staffName:
          socialNames[studentIndex % socialNames.length],
        staffType: 'Social Counseling',
        service: 'Social Counseling',
        day: days[studentIndex % days.length],
        time:
          specialtyTimes[
            Math.floor(studentIndex / socialNames.length) %
              specialtyTimes.length
          ],
        duration: 30,
        frequency: 'Weekly',
        location: 'Counseling Office',
        note: 'Weekly social-emotional and peer support.'
      })

      // Weekly OT.
      addRow({
        student,
        staffName: 'Tzvi Malks',
        staffType: 'OT',
        service: 'OT',
        day: days[studentIndex % days.length],
        time:
          specialtyTimes[
            Math.floor(studentIndex / days.length) %
              specialtyTimes.length
          ],
        duration: 30,
        frequency: 'Weekly',
        location: 'OT Room',
        note: 'Fine motor, sensory regulation, and classroom readiness.'
      })

      // Weekly Speech.
      addRow({
        student,
        staffName: 'Yitzi Liebowitz',
        staffType: 'Speech',
        service: 'Speech',
        day: days[(studentIndex + 1) % days.length],
        time:
          specialtyTimes[
            Math.floor(studentIndex / days.length) %
              specialtyTimes.length
          ],
        duration: 30,
        frequency: 'Weekly',
        location: 'Speech Room',
        note: 'Language, articulation, and communication support.'
      })

      // Weekly PT.
      addRow({
        student,
        staffName: 'Aryeh Schechter',
        staffType: 'PT',
        service: 'PT',
        day: days[(studentIndex + 2) % days.length],
        time:
          specialtyTimes[
            Math.floor(studentIndex / days.length) %
              specialtyTimes.length
          ],
        duration: 30,
        frequency: 'Weekly',
        location: 'PT Room',
        note: 'Gross motor and physical support.'
      })

      // BCBA observation under the student's assigned BCBA.
      addRow({
        student,
        staffName: assignedBcba,
        staffType: 'BCBA',
        service: 'BCBA Observation',
        day: days[(studentIndex + 3) % days.length],
        time:
          specialtyTimes[
            Math.floor(studentIndex / 3) %
              specialtyTimes.length
          ],
        duration: 30,
        frequency: 'Biweekly',
        location: 'Classroom',
        supervisingBcba: assignedBcba,
        note:
          `Observation for ${assignedBt}'s caseload and behavior-plan review.`
      })
    })

    return rows
  }

  const [setupTherapySchedule, setSetupTherapySchedule] = useState(
    createFakeTherapySchedule
  )
  const [setupTherapyView, setSetupTherapyView] = useState('therapist')
  const [setupTherapyFilters, setSetupTherapyFilters] = useState([])

  const addSetupTherapyFilter = () => {
    setSetupTherapyFilters(previous => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        field: 'day',
        value: 'Monday'
      }
    ])
  }

  const updateSetupTherapyFilter = (id, changes) => {
    setSetupTherapyFilters(previous =>
      previous.map(filter =>
        filter.id === id
          ? { ...filter, ...changes }
          : filter
      )
    )
  }

  const removeSetupTherapyFilter = id => {
    setSetupTherapyFilters(previous =>
      previous.filter(filter => filter.id !== id)
    )
  }

  // Persist therapy schedule changes
  useEffect(() => {
    if (setupTherapySchedule && setupTherapySchedule.length > 0) {
      saveTherapySchedule(setupTherapySchedule)
    }
  }, [setupTherapySchedule])

  const [intakeList, setIntakeList] = useState(() => enrichIntakeDemoData([
    { id: 1, name: 'Moshe Friedman', dob: '2012-03-15', currentSchool: 'Yeshiva Ohr Torah', shul: 'Khal Avreichim', heardAbout: 'Rabbi Klein', fatherName: 'Avraham Friedman', fatherPhone: '718-555-1234', motherName: 'Rivka', motherMaiden: 'Schwartz', motherPhone: '718-555-1235', address: '1234 56th St Brooklyn NY', program: 'mesivta', status: 'interviewed', tourDate: '2026-05-28', tourBy: 'Rabbi Baum', interviewDate: '2026-06-04', nextStep: 'Admissions team decision', diagnoses: ['ADHD', 'Anxiety'], issues: 'Difficulty focusing in large groups. Responds well 1-on-1.', interviewNotes: 'Very bright boy. Strong in Gemara. Needs structured environment.', scores: { tefillah: 4, kriah: 3, gemaraReading: 4, gemaraTranslation: 3, gemaraComprehension: 3, rashiScript: 3, mathAddition: 4, mathSubtraction: 3, mathMultiplication: 2, mathDivision: 2, englishReading: 4, readingComprehension: 3, writingSkills: 3, spellingVocabulary: 3 }, placements: { tefillah: 'independent', kriah: 'developing', gemaraReading: 'independent', gemaraTranslation: 'developing', gemaraComprehension: 'developing', rashiScript: 'developing', mathAddition: 'independent', mathSubtraction: 'developing', mathMultiplication: 'foundational', mathDivision: 'foundational', englishReading: 'independent', readingComprehension: 'developing', writingSkills: 'developing', spellingVocabulary: 'developing' }, documents: [{ name: 'Assessment_Friedman.pdf', date: '2025-11-10' }] },
    { id: 2, name: 'Yosef Stern', dob: '2011-07-22', currentSchool: 'Mesivta Beis Shraga', shul: 'Young Israel', heardAbout: 'Parent referral', fatherName: 'Shmuel Stern', fatherPhone: '718-555-5678', motherName: 'Chana', motherMaiden: 'Goldberg', motherPhone: '718-555-5679', address: '567 Ave J Brooklyn NY', program: 'mesivta', status: 'applicant', tourDate: '', tourBy: '', interviewDate: '', nextStep: 'Schedule tour', diagnoses: [], issues: '', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 3, name: 'Dovid Katz', dob: '2012-11-05', currentSchool: 'Talmud Torah Ohel Moshe', shul: 'Bobov', heardAbout: 'Website', fatherName: 'Pinchas Katz', fatherPhone: '718-555-9012', motherName: 'Sara', motherMaiden: 'Weiss', motherPhone: '718-555-9013', address: '890 48th St Brooklyn NY', program: 'mesivta', status: 'accepted', tourDate: '2026-05-22', tourBy: 'Rabbi Fried', interviewDate: '2026-05-30', nextStep: 'Collect enrollment forms', diagnoses: ['Dyslexia'], issues: 'Reading difficulties. Math strong.', interviewNotes: 'Warm personality. Will fit well socially.', scores: { tefillah: 4, kriah: 2, gemaraReading: 3, gemaraTranslation: 2, gemaraComprehension: 2, rashiScript: 2, mathAddition: 4, mathSubtraction: 4, mathMultiplication: 4, mathDivision: 3, englishReading: 2, readingComprehension: 2, writingSkills: 3, spellingVocabulary: 2 }, placements: { tefillah: 'independent', kriah: 'foundational', gemaraReading: 'developing', gemaraTranslation: 'foundational', gemaraComprehension: 'foundational', rashiScript: 'foundational', mathAddition: 'independent', mathSubtraction: 'independent', mathMultiplication: 'independent', mathDivision: 'developing', englishReading: 'foundational', readingComprehension: 'foundational', writingSkills: 'developing', spellingVocabulary: 'foundational' }, documents: [{ name: 'Psych_Eval_Katz.pdf', date: '2025-10-15' }, { name: 'IEP_Katz.pdf', date: '2025-10-15' }] },
    { id: 4, name: 'Ari Goldstein', dob: '2012-05-11', currentSchool: 'Yeshiva Darchei Torah', shul: 'Agudas Yisroel', heardAbout: 'Parent referral', fatherName: 'Yehuda Goldstein', fatherPhone: '718-555-2201', motherName: 'Miriam', motherMaiden: 'Klein', motherPhone: '718-555-2202', address: 'Brooklyn NY', program: 'mesivta', status: 'tour-completed', tourDate: '2026-06-06', tourBy: 'Rabbi Baum', interviewDate: '', nextStep: 'Schedule interview', diagnoses: ['ADHD'], issues: 'Needs smaller class setting and clear structure.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 5, name: 'Shimon Adler', dob: '2011-12-02', currentSchool: 'Torah Vodaath', shul: 'Bnei Torah', heardAbout: 'Current parent', fatherName: 'Mordechai Adler', fatherPhone: '718-555-2211', motherName: 'Esther', motherMaiden: 'Landau', motherPhone: '718-555-2212', address: 'Brooklyn NY', program: 'mesivta', status: 'interview-scheduled', tourDate: '2026-06-02', tourBy: 'Rabbi Fried', interviewDate: '2026-06-13', nextStep: 'Prepare interview packet', diagnoses: [], issues: 'Family looking for a calmer class environment.', interviewNotes: '', scores: {}, placements: {}, documents: [{ name: 'Report_Card_Adler.pdf', date: '2026-06-01' }] },
    { id: 6, name: 'Mendy Rosen', dob: '2012-01-19', currentSchool: 'Yeshiva Ohr Yitzchok', shul: 'Satmar', heardAbout: 'Website', fatherName: 'Eliyahu Rosen', fatherPhone: '718-555-2221', motherName: 'Baila', motherMaiden: 'Fried', motherPhone: '718-555-2222', address: 'Brooklyn NY', program: 'mesivta', status: 'tour-scheduled', tourDate: '2026-06-17', tourBy: 'Rabbi Baum', interviewDate: '', nextStep: 'Tour scheduled', diagnoses: ['Language delay'], issues: 'Parent reports expressive language difficulty.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 7, name: 'Yehuda Mandel', dob: '2012-09-07', currentSchool: 'Talmud Torah Imrei Chaim', shul: 'Viznitz', heardAbout: 'Therapist referral', fatherName: 'Chaim Mandel', fatherPhone: '718-555-2231', motherName: 'Gitty', motherMaiden: 'Weinberger', motherPhone: '718-555-2232', address: 'Brooklyn NY', program: 'mesivta', status: 'applicant', tourDate: '', tourBy: '', interviewDate: '', nextStep: 'Call family to schedule tour', diagnoses: ['Anxiety'], issues: 'May need gradual transition and predictable schedule.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 8, name: 'Chaim Weber', dob: '2011-10-23', currentSchool: 'Mesivta Ohr Naftali', shul: 'Belz', heardAbout: 'Rabbi Fried', fatherName: 'Noach Weber', fatherPhone: '718-555-2241', motherName: 'Devorah', motherMaiden: 'Stern', motherPhone: '718-555-2242', address: 'Brooklyn NY', program: 'mesivta', status: 'enrolled', tourDate: '2026-05-12', tourBy: 'Rabbi Fried', interviewDate: '2026-05-19', nextStep: 'Add to September roster', diagnoses: [], issues: 'Strong candidate. Parents completed enrollment packet.', interviewNotes: 'Good fit socially and academically.', scores: {}, placements: {}, documents: [{ name: 'Enrollment_Weber.pdf', date: '2026-05-25' }] },
    { id: 9, name: 'Bentzion Levy', dob: '2013-02-14', currentSchool: 'Yeshiva Ketana Ohr Moshe', shul: 'Bobov', heardAbout: 'Parent referral', fatherName: 'Aharon Levy', fatherPhone: '718-555-2251', motherName: 'Malka', motherMaiden: 'Berger', motherPhone: '718-555-2252', address: 'Brooklyn NY', program: 'yeshiva-ketana', status: 'tour-completed', tourDate: '2026-06-05', tourBy: 'Rabbi Baum', interviewDate: '', nextStep: 'Schedule assessment', diagnoses: [], issues: 'Needs 8th grade placement review.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 10, name: 'Moshe Braver', dob: '2013-06-30', currentSchool: 'Talmud Torah Nachlas Yakov', shul: 'Skver', heardAbout: 'Phone inquiry', fatherName: 'Yitzchok Braver', fatherPhone: '718-555-2261', motherName: 'Suri', motherMaiden: 'Katz', motherPhone: '718-555-2262', address: 'Brooklyn NY', program: 'yeshiva-ketana', status: 'interviewed', tourDate: '2026-06-03', tourBy: 'Rabbi Fried', interviewDate: '2026-06-10', nextStep: 'Review assessment scores', diagnoses: ['Dyslexia'], issues: 'Reading support needed. Very motivated.', interviewNotes: 'Pleasant, cooperative, needs kriah support.', scores: { kriah: 2, englishReading: 3, mathAddition: 4 }, placements: { kriah: 'foundational', englishReading: 'developing', mathAddition: 'independent' }, documents: [{ name: 'Reading_Report_Braver.pdf', date: '2026-06-10' }] },
    { id: 11, name: 'Yitzi Kleinman', dob: '2013-08-03', currentSchool: 'Yeshiva Tiferes Shmuel', shul: 'Pupa', heardAbout: 'Rabbi Schults', fatherName: 'Shloime Kleinman', fatherPhone: '718-555-2271', motherName: 'Chaya', motherMaiden: 'Heller', motherPhone: '718-555-2272', address: 'Brooklyn NY', program: 'yeshiva-ketana', status: 'accepted', tourDate: '2026-05-29', tourBy: 'Rabbi Baum', interviewDate: '2026-06-06', nextStep: 'Confirm transportation', diagnoses: [], issues: 'Good fit for YK Alef.', interviewNotes: 'Quiet but engaged.', scores: {}, placements: {}, documents: [{ name: 'Acceptance_Kleinman.pdf', date: '2026-06-08' }] },
    { id: 12, name: 'Noach Halpern', dob: '2013-11-17', currentSchool: 'Cheder Toras Emes', shul: 'Ger', heardAbout: 'Website', fatherName: 'Meir Halpern', fatherPhone: '718-555-2281', motherName: 'Rochel', motherMaiden: 'Feld', motherPhone: '718-555-2282', address: 'Brooklyn NY', program: 'yeshiva-ketana', status: 'applicant', tourDate: '', tourBy: '', interviewDate: '', nextStep: 'Send application checklist', diagnoses: ['Speech delay'], issues: 'Speech services requested by parent.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 13, name: 'Dovid Neustadt', dob: '2012-04-22', currentSchool: 'Mesivta Bais Dovid', shul: 'Stolin', heardAbout: 'Rabbi Weiss', fatherName: 'Hershel Neustadt', fatherPhone: '718-555-2291', motherName: 'Frady', motherMaiden: 'Pollak', motherPhone: '718-555-2292', address: 'Brooklyn NY', program: 'mesivta', status: 'interview-scheduled', tourDate: '2026-06-04', tourBy: 'Rabbi Fried', interviewDate: '2026-06-18', nextStep: 'Collect teacher report', diagnoses: ['ADHD'], issues: 'Needs executive-function support.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 14, name: 'Eliezer Gross', dob: '2011-05-27', currentSchool: 'Yeshiva Beis Aharon', shul: 'Karlin', heardAbout: 'Current parent', fatherName: 'Yakov Gross', fatherPhone: '718-555-2301', motherName: 'Hindy', motherMaiden: 'Fischer', motherPhone: '718-555-2302', address: 'Brooklyn NY', program: 'mesivta', status: 'tour-scheduled', tourDate: '2026-06-20', tourBy: 'Rabbi Baum', interviewDate: '', nextStep: 'Tour scheduled', diagnoses: [], issues: 'Parents want smaller setting.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
    { id: 15, name: 'Shmuel Meisels', dob: '2013-03-08', currentSchool: 'Yeshiva Ketana Chasdei Torah', shul: 'Toldos Aharon', heardAbout: 'Parent referral', fatherName: 'Yoel Meisels', fatherPhone: '718-555-2311', motherName: 'Ruchy', motherMaiden: 'Deutsch', motherPhone: '718-555-2312', address: 'Brooklyn NY', program: 'yeshiva-ketana', status: 'tour-completed', tourDate: '2026-06-07', tourBy: 'Rabbi Fried', interviewDate: '', nextStep: 'Schedule assessment', diagnoses: [], issues: 'Could be a fit for Rabbi Schimborski group.', interviewNotes: '', scores: {}, placements: {}, documents: [] },
  ]))
  const [selectedIntake, setSelectedIntake] = useState(null)
  const [openIntakeDoc, setOpenIntakeDoc] = useState(null)
  const [intakeTab, setIntakeTab] = useState('info')
  const [intakeSection, setIntakeSection] = useState('pre') // 'pre' or 'applicants'
  const [intakeApplicantFilter, setIntakeApplicantFilter] = useState('all')
  const [preIntakeList, setPreIntakeList] = useState([
    { id: 1, name: 'Menachem Goldstein', phone: '718-555-1001', program: 'mesivta', status: 'call-back', callNotes: 'Mother called, very interested. Son is currently in Oholei Torah.', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 2, name: 'Yaakov Rosenberg', phone: '718-555-1002', program: 'mesivta', status: 'call-back', callNotes: 'Father left message, needs callback.', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 3, name: 'Avrohom Stein', phone: '718-555-1003', program: 'mesivta', status: 'tour-scheduled', callNotes: 'Very motivated family. Boy has ADHD, doing well with support.', tourDate: '2026-06-10', tourTime: '10:00', interviewDate: '', interviewTime: '', followUpNotes: 'Remind day before' },
    { id: 4, name: 'Boruch Friedman', phone: '718-555-1004', program: 'mesivta', status: 'tour-scheduled', callNotes: 'Rabbi Klein referred them.', tourDate: '2026-06-10', tourTime: '11:30', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 5, name: 'Shmuel Weiss', phone: '718-555-1005', program: 'mesivta', status: 'interview-scheduled', callNotes: 'Came for tour last week, very impressed.', tourDate: '2026-06-03', tourTime: '10:00', interviewDate: '2026-06-12', interviewTime: '09:00', followUpNotes: 'Send reminders' },
    { id: 6, name: 'Pinchas Kohn', phone: '718-555-1006', program: 'mesivta', status: 'interview-scheduled', callNotes: 'Family from Monsey, willing to relocate.', tourDate: '2026-06-04', tourTime: '14:00', interviewDate: '2026-06-13', interviewTime: '10:00', followUpNotes: '' },
    { id: 7, name: 'Dovid Levi', phone: '718-555-1007', program: 'mesivta', status: 'needs-interview-time', callNotes: 'Tour done. Ready to schedule interview.', tourDate: '2026-06-05', tourTime: '10:00', interviewDate: '', interviewTime: '', followUpNotes: 'Call to set interview time' },
    { id: 8, name: 'Nochum Klein', phone: '718-555-1008', program: 'yeshiva-ketana', status: 'call-back', callNotes: 'Parent called about 7th grade placement.', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 9, name: 'Yitzchok Blum', phone: '718-555-1009', program: 'yeshiva-ketana', status: 'call-back', callNotes: 'Inquiry from website.', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 10, name: 'Moshe Berger', phone: '718-555-1010', program: 'yeshiva-ketana', status: 'tour-scheduled', callNotes: 'Looking for 8th grade.', tourDate: '2026-06-11', tourTime: '09:30', interviewDate: '', interviewTime: '', followUpNotes: '' },
  ])
  const [selectedPreIntake, setSelectedPreIntake] = useState(null)
  const [todos, setTodos] = useState([])
  const [todosLoaded, setTodosLoaded] = useState(false)
  const [todoLoadError, setTodoLoadError] = useState(null)
  const [newTodo, setNewTodo] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('general')
  const [newTodoTime, setNewTodoTime] = useState('')

  function setStoredAuthUser(roleValue: string, nameValue: string) {
    try {
      sessionStorage.setItem(
        AUTH_USER_STORAGE_KEY,
        JSON.stringify({ role: roleValue, name: nameValue })
      )
    } catch (error) {
      console.error('Failed to persist auth user:', error)
    }
  }

  function clearStoredAuthUser() {
    try {
      sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear auth user:', error)
    }
  }

  async function handleLogin(r, name) { 
    const access = getUserAccess(name, r)
    setRole(r)
    setUserName(name)
    setStoredAuthUser(r, name)
    setDivisionView(defaultDivisionView(access))
    setLoggedIn(true)
    setPage(r === 'store' ? 'store' : 'dashboard')
    if (r === 'teacher') {
      const classIds = getTeacherAssignedClassIds(name, setupAssignments, students)
      setTeacherClassIds(classIds)
      setTeacherClass(classIds[0] || TEACHER_CLASS_MAP[name] || null)
    } else {
      setTeacherClass(null)
      setTeacherClassIds([])
    }
    
    // Record login session for the primary login identity.
    try {
      const staff = await getStaffByName(name)
      if (staff) {
        const existingSessionId = activeSessionIds[staff.id]
        if (existingSessionId) {
          setCurrentSessionId(existingSessionId)
          return
        }

        const session = await recordLoginSession(staff.id, name, r)
        if (session) {
          setCurrentSessionId(session.id)
          setActiveSessionIds(prev => ({
            ...prev,
            [staff.id]: session.id,
          }))
        }
      }
    } catch (error) {
      console.error('Failed to record login session:', error)
    }
  }

  async function handleAddStaffLogin(staff) {
    const roleText = [staff.role, ...(staff.roles || [])].join(' ').toLowerCase()
    const role = /teacher|rebbe/.test(roleText)
      ? 'teacher'
      : /therap|speech|ot|pt|bcba|counsel|bt/.test(roleText)
        ? 'therapist'
        : 'admin'
    
    setLoggedInStaff(prev => {
      if (prev.some(existing => existing.id === staff.id)) {
        return prev
      }
      return [...prev, staff]
    })

    if (!activeSessionIds[staff.id]) {
      try {
        const session = await recordLoginSession(staff.id, staff.name, role)
        if (session) {
          setActiveSessionIds(prev => ({
            ...prev,
            [staff.id]: session.id,
          }))
        }
      } catch (error) {
        console.error('Failed to record added staff login session:', error)
      }
    }
    
    // Also set as primary user if no one else is logged in
    if (!loggedIn) {
      handleLogin(role, staff.name)
    }
  }

  async function handleRemoveStaffLogin(staffId) {
    setLoggedInStaff(prev => prev.filter(s => s.id !== staffId))

    const sessionId = activeSessionIds[staffId]
    if (sessionId) {
      try {
        await recordLogoutSession(sessionId)
      } catch (error) {
        console.error('Failed to record logout for removed staff:', error)
      } finally {
        setActiveSessionIds(prev => {
          const next = { ...prev }
          delete next[staffId]
          return next
        })
      }
    }
    
    // If we're removing the currently logged-in user, log them out
    const removedStaff = loggedInStaff.find(s => s.id === staffId)
    if (removedStaff && userName === removedStaff.name) {
      const remainingSessionIds = Object.entries(activeSessionIds)
        .filter(([id]) => Number(id) !== Number(staffId))
        .map(([, sessionIdValue]) => sessionIdValue)

      if (remainingSessionIds.length > 0) {
        await Promise.all(
          remainingSessionIds.map(async sessionIdValue => {
            try {
              await recordLogoutSession(sessionIdValue)
            } catch (error) {
              console.error('Failed to record logout for remaining staff:', error)
            }
          })
        )
      }
      
      setLoggedIn(false)
      setUserName('')
      setRole('admin')
      clearStoredAuthUser()
      setCurrentSessionId(null)
      setActiveSessionIds({})
      if (teacherUser) {
        onTeacherSessionLogout?.()
      }
    }
  }

  async function handleLogout() {
    const sessionIds = Object.values(activeSessionIds)

    if (sessionIds.length > 0) {
      await Promise.all(
        sessionIds.map(async sessionId => {
          try {
            await recordLogoutSession(sessionId)
          } catch (error) {
            console.error('Failed to record logout:', error)
          }
        })
      )
    } else if (currentSessionId) {
      try {
        await recordLogoutSession(currentSessionId)
      } catch (error) {
        console.error('Failed to record logout:', error)
      }
    }
    
    setLoggedIn(false)
    setUserName('')
    setRole('admin')
    clearStoredAuthUser()
    setCurrentSessionId(null)
    setActiveSessionIds({})
    if (teacherUser) {
      onTeacherSessionLogout?.()
    }
  }

  async function saveStudentField(id, field, value) {
    const payload = { [field]: value }
    const { error } = await supabase.from('students').update(payload).eq('id', id)
    if (error) {
      console.error('Supabase update failed:', error)
      alert('Unable to save student status to Supabase.')
      return false
    }
    return true
  }

  async function recordStudentPointsAction({
    studentId,
    pointsDelta,
    reminderDelta = 0,
    reason,
    eventType,
    category,
    sourceContext,
    note = null,
    metadata = {},
  }) {
    const originalStudent = students.find(
      student => Number(student.id) === Number(studentId)
    )

    if (!originalStudent) {
      return false
    }

    const nextPoints = Math.max(
      0,
      Number(originalStudent.points || 0) + Number(pointsDelta || 0)
    )
    const nextReminders = Math.max(
      0,
      Number(originalStudent.reminders || 0) + Number(reminderDelta || 0)
    )
    const nextBehaviorLog = [
      {
        label: reason,
        points: pointsDelta,
        date: new Date().toISOString().slice(0, 10),
      },
      ...(originalStudent.behaviorLog || []),
    ].slice(0, 30)

    setStudents(prev => prev.map(student =>
      Number(student.id) !== Number(studentId)
        ? student
        : {
            ...student,
            points: nextPoints,
            reminders: nextReminders,
            behaviorLog: nextBehaviorLog,
          }
    ))

    let eventId = null

    try {
      eventId = await createPointsEvent({
        studentId: Number(originalStudent.id),
        studentName: originalStudent.name,
        staffName: userName || 'Staff',
        staffRole: role || 'staff',
        pointsDelta: Number(pointsDelta || 0),
        eventType,
        category,
        reason,
        note,
        sourcePage: category,
        sourceContext,
        metadata: {
          ...metadata,
          reminderDelta: Number(reminderDelta || 0),
        },
      })

      const saved = await persistStudentFields(originalStudent.id, {
        token_balance: nextPoints,
        reminders: nextReminders,
      })

      if (!saved) {
        throw new Error('Unable to save token balance.')
      }

      return true
    } catch (error) {
      if (eventId) {
        try {
          await deletePointsEvent(eventId)
        } catch (rollbackError) {
          console.error('Unable to roll back points event:', rollbackError)
        }
      }

      console.error('Points event write failed:', error)

      setStudents(prev => prev.map(student =>
        Number(student.id) !== Number(studentId)
          ? student
          : originalStudent
      ))

      alert('Unable to save points activity to Supabase.')
      return false
    }
  }

  async function undoPointsEvent(event) {
    const currentStudent = students.find(
      student => Number(student.id) === Number(event.student_id)
    )

    if (!currentStudent) {
      throw new Error('Student was not found for this event.')
    }

    const originalPointsDelta = Number(event.points_delta || 0)
    const originalReminderDelta = Number(
      event?.metadata?.reminderDelta || (event.event_type === 'reminder' ? 1 : 0)
    )
    const reversalPointsDelta = -originalPointsDelta
    const reversalReminderDelta = -originalReminderDelta
    const nextPoints = Math.max(
      0,
      Number(currentStudent.points || 0) + reversalPointsDelta
    )
    const nextReminders = Math.max(
      0,
      Number(currentStudent.reminders || 0) + reversalReminderDelta
    )

    setStudents(prev => prev.map(student =>
      Number(student.id) !== Number(currentStudent.id)
        ? student
        : {
            ...student,
            points: nextPoints,
            token_balance: nextPoints,
            reminders: nextReminders,
            behaviorLog: [
              {
                label: `Undo: ${event.reason}`,
                points: reversalPointsDelta,
                date: new Date().toISOString().slice(0, 10),
              },
              ...(student.behaviorLog || []),
            ].slice(0, 30),
          }
    ))

    let undoEventId = null

    try {
      undoEventId = await createPointsEvent({
        studentId: Number(currentStudent.id),
        studentName: currentStudent.name,
        staffName: userName || 'Staff',
        staffRole: role || 'staff',
        pointsDelta: reversalPointsDelta,
        eventType: 'reversal',
        category: event.category,
        reason: `Undo: ${event.reason}`,
        note: `Reversed event #${event.id}`,
        sourcePage: event.source_page || event.category,
        sourceContext: 'history-undo',
        relatedEventId: Number(event.id),
        metadata: {
          reversedEventId: Number(event.id),
          originalEventType: event.event_type,
          originalPointsDelta,
          originalReminderDelta,
        },
      })

      const saved = await persistStudentFields(currentStudent.id, {
        token_balance: nextPoints,
        reminders: nextReminders,
      })

      if (!saved) {
        throw new Error('Unable to save token balance.')
      }

      try {
        const refreshedEvents = await listPointsEventsForStudent(Number(currentStudent.id))
        setSelectedStudentPointsEvents(refreshedEvents)
      } catch (refreshError) {
        console.error('Unable to refresh points history after undo:', refreshError)
      }

      return true
    } catch (error) {
      if (undoEventId) {
        try {
          await deletePointsEvent(undoEventId)
        } catch (rollbackError) {
          console.error('Unable to roll back undo event:', rollbackError)
        }
      }

      console.error('Undo points event failed:', error)

      setStudents(prev => prev.map(student =>
        Number(student.id) !== Number(currentStudent.id)
          ? student
          : {
              ...currentStudent,
              token_balance: currentStudent.token_balance,
            }
      ))

      throw error instanceof Error
        ? error
        : new Error('Unable to undo points activity in Supabase.')
    }
  }

  async function updateStatus(id, status) {
    const original = students.find(s => s.id === id)
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    const success = await saveStudentField(id, 'status', status)
    if (!success && original) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: original.status } : s))
    }
  }
  async function buyItem(studentId, item) {
    const s = students.find(x => x.id === studentId)
    if (!s || s.points < item.cost) { alert('Not enough points!'); return }
    if ((item.stock ?? 0) <= 0) { alert(`${item.name} is out of stock.`); return }
    if (isStoreItemRestrictedForStudent(s, item)) { alert(`${s.name} cannot redeem candy items.`); return }
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    playSound('store')
    let redemptionId = null
    let stockAdjusted = false

    try {
      const stockRow = await adjustStoreItemStockBy(
        Number(item.id),
        -1,
        userName || 'Register',
      )

      stockAdjusted = true

      setStoreItems(prev => prev.map(entry => (
        Number(entry.id) === Number(stockRow.id)
          ? { ...entry, ...stockRow }
          : entry
      )))

      const redemption = await createStoreRedemption({
        studentId: Number(s.id),
        studentName: s.name,
        itemId: Number(item.id),
        itemName: item.name,
        cost: Number(item.cost || 0),
        staffName: userName || 'Register',
        source: 'token-store',
        metadata: {
          division: studentDivision(s),
          staffRole: role || 'staff',
        },
      })

      redemptionId = redemption.id

      const pointsSaved = await recordStudentPointsAction({
      studentId,
      pointsDelta: -Number(item.cost || 0),
      reason: `Store purchase: ${item.name}`,
      eventType: 'purchase',
      category: 'store',
      sourceContext: 'token-store-redeem',
      note: `${s.name} redeemed ${item.name}`,
      metadata: {
        itemId: item.id,
        itemName: item.name,
        itemCost: item.cost,
      },
    })

      if (!pointsSaved) {
        if (redemptionId) {
          try {
            await deleteStoreRedemption(redemptionId)
          } catch (deleteError) {
            console.error('Unable to roll back store redemption row:', deleteError)
          }
        }

        if (stockAdjusted) {
          try {
            const restoredRow = await adjustStoreItemStockBy(
              Number(item.id),
              1,
              userName || 'Register',
            )
            setStoreItems(prev => prev.map(entry => (
              Number(entry.id) === Number(restoredRow.id)
                ? { ...entry, ...restoredRow }
                : entry
            )))
          } catch (rollbackError) {
            console.error('Unable to roll back store stock:', rollbackError)
          }
        }

        return
      }

      setPurchaseLog(prev => [{
        id: redemption.id,
        time: new Date(redemption.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        studentId: redemption.studentId,
        studentName: redemption.studentName,
        itemName: redemption.itemName,
        cost: redemption.cost,
        staff: redemption.staffName,
        division: String(redemption.metadata?.division || ''),
      }, ...prev].slice(0, 25))

      alert(`${s.name} redeemed: ${item.name}!`)
    } catch (error) {
      if (redemptionId) {
        try {
          await deleteStoreRedemption(redemptionId)
        } catch (deleteError) {
          console.error('Unable to roll back store redemption row:', deleteError)
        }
      }

      if (stockAdjusted) {
        try {
          const restoredRow = await adjustStoreItemStockBy(
            Number(item.id),
            1,
            userName || 'Register',
          )
          setStoreItems(prev => prev.map(entry => (
            Number(entry.id) === Number(restoredRow.id)
              ? { ...entry, ...restoredRow }
              : entry
          )))
        } catch (rollbackError) {
          console.error('Unable to roll back store stock:', rollbackError)
        }
      }

      console.error('Store redemption failed:', error)

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to complete store redemption.',
      )
    }
  }

  function updateStoreItem(id, field, value) {
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    let previousItem = null
    let nextItem = null

    setStoreItems(prev => prev.map(item => {
      if (Number(item.id) !== Number(id)) return item

      previousItem = item

      if (field === 'cost' || field === 'stock' || field === 'lowStockAt') {
        nextItem = { ...item, [field]: Math.max(0, Number(value) || 0) }
        return nextItem
      }

      if (field === 'vip') {
        nextItem = { ...item, vip: value }
        return nextItem
      }

      nextItem = { ...item, [field]: value }
      return nextItem
    }))

    if (!nextItem) return

    saveStoreItem(nextItem, userName || 'Store Manager')
      .then(savedItem => {
        setStoreItems(prev => prev.map(item => (
          Number(item.id) === Number(savedItem.id)
            ? { ...item, ...savedItem }
            : item
        )))
      })
      .catch(error => {
        console.error('Unable to save store item:', error)

        if (previousItem) {
          setStoreItems(prev => prev.map(item => (
            Number(item.id) === Number(previousItem.id)
              ? previousItem
              : item
          )))
        }

        alert('Unable to save store item changes.')
      })
  }

  function adjustStoreStock(id, amount) {
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    adjustStoreItemStockBy(Number(id), Number(amount || 0), userName || 'Store Manager')
      .then(savedItem => {
        setStoreItems(prev => prev.map(item => (
          Number(item.id) === Number(savedItem.id)
            ? { ...item, ...savedItem }
            : item
        )))
      })
      .catch(error => {
        console.error('Unable to adjust stock:', error)
        alert(
          error instanceof Error
            ? error.message
            : 'Unable to adjust store stock.',
        )
      })
  }

  async function addStoreItem() {
    if (!newStoreItem.name.trim()) { alert('Add an item name first.'); return }
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    try {
      const item = await createStoreItem({
        name: newStoreItem.name.trim(),
        category: (newStoreItem.category || 'nosh').trim() || 'nosh',
        cost: Math.max(0, Number(newStoreItem.cost) || 0),
        emoji: newStoreItem.emoji.trim() || '▪️',
        vip: !!newStoreItem.vip,
        stock: Math.max(0, Number(newStoreItem.stock) || 0),
        lowStockAt: Math.max(0, Number(newStoreItem.lowStockAt) || 0),
      }, userName || 'Store Manager')

      setStoreItems(prev => [...prev, item])
      setNewStoreItem({ name: '', cost: '', stock: '', lowStockAt: '5', emoji: '', category: 'nosh', vip: false })
    } catch (error) {
      console.error('Unable to add store item:', error)
      alert('Unable to add store item.')
    }
  }

  async function removeStoreItem(id) {
    if (!confirm('Remove this store item from the demo?')) return
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    try {
      await setStoreItemActive(Number(id), false, userName || 'Store Manager')
      setStoreItems(prev => prev.filter(item => Number(item.id) !== Number(id)))
    } catch (error) {
      console.error('Unable to remove store item:', error)
      alert('Unable to remove store item.')
    }
  }

  function updateUnknownLocation(studentId, newStatus, label) {
    const note = (unknownNotes[studentId] || '').trim()
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const studentBeforeUpdate = students.find(s => s.id === studentId)
    const actor = userName || 'Staff'
    const logNote = `Location updated from Unknown to ${label} by ${actor}.${note ? ` Note: ${note}` : ''}`
    const updatedClassLog = [
      ...(studentBeforeUpdate?.classLog || []),
      {
        time,
        type: 'status-update',
        note: logNote,
        staffId: null,
        staffName: actor,
        recordedAt: new Date().toISOString(),
      }
    ]
    
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      return {
        ...s,
        status: newStatus === 'left-early' ? 'left-early' : newStatus,
        dailyStatus: newStatus === 'absent' ? 'absent' : newStatus === 'left-early' ? 'left-early' : s.dailyStatus,
        classLog: updatedClassLog
      }
    }))
    
    persistStudentFields(studentId, {
      status: newStatus === 'left-early' ? 'left-early' : newStatus,
      dailyStatus:
        newStatus === 'absent'
          ? 'absent'
          : newStatus === 'left-early'
            ? 'left-early'
            : studentBeforeUpdate?.dailyStatus,
      classLog: updatedClassLog,
    })
    setUnknownNotes(prev => ({ ...prev, [studentId]: '' }))
    if (students.filter(s => s.status === 'unknown' && s.id !== studentId).length === 0) setShowUnknownPopup(false)
  }

  if (!loggedIn) {
    return (
      <div>
        <LoginPage onLogin={handleLogin} />
        <div style={{ position: 'fixed', bottom: 20, right: 20, fontSize: 12, color: '#64748b' }}>
          <a href="/teacher" style={{ background: '#f8fafc', border: '1px solid #d8dee9', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#334155', textDecoration: 'none', display: 'inline-block' }}>
            👨‍🏫 Teacher Login →
          </a>
        </div>
      </div>
    )
  }

  const userAccessForMode = getUserAccess(userName, role)
  const allowedDivisionSetForMode = new Set(userAccessForMode.divisions)
  const divisionScopedStudentsForMode = students.filter(
    s =>
      allowedDivisionSetForMode.has(studentDivision(s)) &&
      (divisionView === 'all' || studentDivision(s) === divisionView)
  )
  const isTeacherRoleForMode = role === 'teacher' || role === 'rebbe'
  const assignedTeacherClassIdsForMode = isTeacherRoleForMode
    ? (
        teacherClassIds.length > 0
          ? teacherClassIds
          : (teacherClass || TEACHER_CLASS_MAP[userName])
            ? [teacherClass || TEACHER_CLASS_MAP[userName]]
            : []
      )
    : []
  const assignedTeacherStudentIdsForMode = isTeacherRoleForMode
    ? getTeacherAssignedStudentIds(userName, setupAssignments)
    : []
  const assignedTeacherStudentSetForMode = new Set(assignedTeacherStudentIdsForMode)
  const studentsForCurrentRole = isTeacherRoleForMode
    ? (
        assignedTeacherStudentSetForMode.size > 0
          ? students.filter(s => assignedTeacherStudentSetForMode.has(Number(s.id)))
          : divisionScopedStudentsForMode.filter(
              s => assignedTeacherClassIdsForMode.includes(resolveStudentClassId(s))
            )
      )
    : divisionScopedStudentsForMode
  
  if (teachingMode) return (
    <TeachingMode
      students={studentsForCurrentRole}
      setStudents={setStudents}
      onExit={() => setTeachingMode(false)}
      isAdmin={role === 'admin'}
      userName={userName}
      S={S}
      STAFF={STAFF}
      STUDENT_CLASSES={STUDENT_CLASSES}
      CLASSES={CLASSES}
      statusColor={statusColor}
      statusEmoji={statusEmoji}
      statusLabel={statusLabel}
      isVIP={checkIsVIP}
      initials={initials}
      persistStudentFields={persistStudentFields}
      persistStudentFieldsBulk={persistStudentFieldsBulk}
      recordStudentPointsAction={recordStudentPointsAction}
    />
  )

  const userAccess = getUserAccess(userName, role)
  const isTeacherRole = role === 'teacher' || role === 'rebbe'
  const isOfficeUser = ['Eli Bloom', 'Zev Reisman', 'Eli Stern'].includes(userName)
  const allowedDivisionSet = new Set(userAccess.divisions)
  const divisionScopedStudents = students.filter(s => allowedDivisionSet.has(studentDivision(s)) && (divisionView === 'all' || studentDivision(s) === divisionView))
  const assignedTeacherClassIds = isTeacherRole
    ? (
        teacherClassIds.length > 0
          ? teacherClassIds
          : (teacherClass || TEACHER_CLASS_MAP[userName])
            ? [teacherClass || TEACHER_CLASS_MAP[userName]]
            : []
      )
    : []
  const assignedTeacherStudentIds = isTeacherRole
    ? getTeacherAssignedStudentIds(userName, setupAssignments)
    : []
  const assignedTeacherStudentSet = new Set(assignedTeacherStudentIds)
  const visibleStudents = isTeacherRole
    ? (
        assignedTeacherStudentSet.size > 0
          ? students.filter(s => assignedTeacherStudentSet.has(Number(s.id)))
          : divisionScopedStudents.filter(s => assignedTeacherClassIds.includes(resolveStudentClassId(s)))
      )
    : divisionScopedStudents
  const divisionOptions = userAccess.divisions.length > 1 ? ['all', ...userAccess.divisions] : userAccess.divisions
  const present = visibleStudents.filter(s => s.status === 'present').length
  const absent = visibleStudents.filter(s => s.status === 'absent').length
  const late = visibleStudents.filter(s => s.dailyStatus === 'late').length
  const inTherapy = visibleStudents.filter(s => s.status === 'therapy').length
  const withBT = visibleStudents.filter(s => s.status === 'with-bt').length
  const unknown = visibleStudents.filter(s => s.status === 'unknown').length
  const notArrived = visibleStudents.filter(s => s.status === 'not-arrived').length
  const total = visibleStudents.length
  const cameTodayStudents = visibleStudents.filter(s => (s.dailyStatus || 'present') !== 'absent')
  const cameToday = cameTodayStudents.length
  const stillInYeshivaStudents = visibleStudents.filter(s => (s.dailyStatus || 'present') !== 'absent' && (s.dailyStatus || 'present') !== 'left-early')
  const stillInYeshiva = stillInYeshivaStudents.length
  const inClassroomsStudents = visibleStudents.filter(s => s.status === 'present')
  const inClassrooms = inClassroomsStudents.length
  const lateStudents = visibleStudents.filter(s => s.dailyStatus === 'late')
  const leftEarlyStudents = visibleStudents.filter(s => s.dailyStatus === 'left-early')
  const absentTodayStudents = visibleStudents.filter(s => (s.dailyStatus || 'present') === 'absent')
  const cameTodayRate = total ? Math.round(cameToday / total * 100) : 0
  const improved = visibleStudents.filter(s => s.reminders < s.lastWeekReminders).length
  const needsAttention = visibleStudents.filter(s => s.reminders > s.lastWeekReminders).length
  const vipStudents = visibleStudents.filter(s => checkIsVIP(s))
  const urgentStudents = visibleStudents.filter(s => s.reminders >= 6 || s.detention || s.att.filter(d=>d==='A').length >= 3 || s.status === 'unknown')
  const callsDueStudents = visibleStudents.filter(s => { const lc = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length-1] : null; return !lc || daysSince(lc.date) > 14 })
  const divisionSummaries = userAccess.divisions.map(key => {
    const list = students.filter(s => studentDivision(s) === key)
    return {
      key,
      label: divisionLabel(key),
      students: list,
      inBuilding: list.filter(s => (s.dailyStatus || 'present') !== 'absent' && (s.dailyStatus || 'present') !== 'left-early').length,
      unknown: list.filter(s => s.status === 'unknown').length,
      absent: list.filter(s => (s.dailyStatus || 'present') === 'absent').length,
      late: list.filter(s => s.status === 'late').length,
    }
  })

  const alerts = visibleStudents.flatMap(s => {
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
  }).sort((a, b) => {
    const order = { danger: 0, warn: 1, info: 2 }
    return order[a.type] - order[b.type]
  })

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
    { id: 'support', label: `Student Support (${alerts.length})`, icon: 'SS' },
    { id: 'attendance', label: 'Attendance', icon: 'AT' },
    { id: 'academics', label: 'Academics', icon: 'AC' },
    { id: 'store', label: 'Token Store', icon: 'TS' },
    { id: 'todo', label: 'To-Do List', icon: 'TD' },
    { id: 'setup', label: 'Setup Center', icon: 'SE' },
  ]
  const teacherNav = [
    { id: 'dashboard', label: 'My Class', icon: 'MC' },
    { id: 'support', label: `Student Support (${alerts.length})`, icon: 'SS' },
    { id: 'attendance', label: 'Attendance', icon: 'AT' },
    { id: 'academics', label: 'Academics', icon: 'AC' },
    { id: 'schedule', label: 'Schedule', icon: 'SC' },
    { id: 'store', label: 'Token Store', icon: 'TS' },
  ]
  const therapistNav = [
    { id: 'dashboard', label: 'My Students', icon: 'MS' },
    { id: 'support', label: 'Student Support', icon: 'SS' },
    { id: 'schedule', label: 'Schedule', icon: 'SC' },
  ]
  const storeNav = [
    { id: 'store', label: 'Token Store', icon: 'TS' },
  ]

  const navItems = role === 'admin' ? adminNav : (role === 'teacher' || role === 'rebbe') ? teacherNav : role === 'store' ? storeNav : therapistNav
  const showSetupSidebarOnly = page === 'setup' && role === 'admin'
  const mainStyle = showSetupSidebarOnly ? { ...S.main, marginLeft: 0, width: '100%' } : S.main
  const setupNavItems = [
    { id: 'staff-directory', label: 'Staff Directory', icon: '👥', group: 'People & Staff' },
    { id: 'assignments', label: 'Staff Assignments', icon: '🧑‍🏫', group: 'People & Staff' },
    { id: 'therapy-schedule', label: 'Therapy Schedule', icon: '🩺', group: 'People & Staff' },
    { id: 'accounts', label: 'Staff Accounts', icon: '🔐', group: 'People & Staff' },
    { id: 'teaching', label: 'Teaching Actions', icon: '🎓', group: 'Rules & Configuration' },
    { id: 'vip', label: 'VIP Rules', icon: '⭐', group: 'Rules & Configuration' },
    { id: 'store', label: 'Store & Sales', icon: '🛍️', group: 'Rules & Configuration' },
    { id: 'classes-divisions', label: 'Classes & Divisions', icon: '🏫', group: 'School Structure' },
    { id: 'schedule-setup', label: 'Schedule Setup', icon: '🗓️', group: 'School Structure' },
  ]
  const searchedStudents = search ? visibleStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : visibleStudents
  const filteredStudents = attFilter === 'all' ? searchedStudents : searchedStudents.filter(s => s.status === attFilter)

  function ClickCard({ label, val, color, sub, filterStudents, goToPage = null }) {
    return (
      <div onClick={() => { if (goToPage) setPage(goToPage); else if (filterStudents) setDrillDown({ title: label, students: filterStudents }) }}
        style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`, boxShadow: '0 7px 18px rgba(30,41,59,0.045)', cursor: (filterStudents || goToPage) ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { if (filterStudents || goToPage) { e.currentTarget.style.boxShadow = '0 12px 28px rgba(30,41,59,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 7px 18px rgba(30,41,59,0.045)'; e.currentTarget.style.transform = 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {(filterStudents || goToPage) && <span style={{ fontSize: 10, color: '#94a3b8' }}>click →</span>}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  return (
    <div style={S.app}>
      {!showSetupSidebarOnly && (
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f3f7fc', color: '#223046', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, boxShadow: 'inset 0 0 0 1px rgba(34,48,70,0.08)' }}>HA</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Hadran Academy</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', marginTop: 3 }}>{role === 'admin' && isOfficeUser ? 'Office Portal' : role === 'admin' ? 'Menahel Portal' : role === 'teacher' ? 'Teacher Portal' : role === 'store' ? 'Canteen Register' : 'Therapist Portal'}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map(item => (
            <div key={item.id} style={S.sidebarItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', background: page === item.id ? '#35506f' : 'rgba(255,255,255,0.10)', color: page === item.id ? '#fff' : 'rgba(255,255,255,0.78)', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'support' && alerts.filter(a => a.type === 'danger').length > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9f1239', flexShrink: 0 }} />
              )}
            </div>
          ))}
          {role !== 'therapist' && role !== 'store' && (
            <div onClick={() => setTeachingMode(true)} style={{ ...S.sidebarItem(false), background: 'rgba(255,255,255,0.06)', margin: '8px 8px 2px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.10)' }}>{role === 'admin' ? 'SW' : 'TM'}</span><span>{role === 'admin' ? 'School-Wide Mode' : 'Teaching Mode'}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 'auto', padding: '14px 16px 18px', borderTop: '1px solid rgba(255,255,255,0.10)', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>{userName}</div>
          {role === 'admin' && (
            <button
              onClick={() => setShowLoginActivity(true)}
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.78)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 6,
                width: '100%',
                textAlign: 'left',
                marginBottom: 6
              }}
            >
              📊 Login Activity
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.78)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              padding: '8px 10px',
              borderRadius: 8,
              width: '100%',
              textAlign: 'left'
            }}
          >
            ← Logout
          </button>
        </div>
      </div>
      )}

      <div style={mainStyle}>
        <div style={{ maxWidth: 1180, marginLeft: 'auto', marginRight: 'auto' }}>
        {studentFallbackPatchCount > 0 && (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 10,
              border: '1px solid #facc15',
              background: '#fffbeb',
              color: '#854d0e',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>
              Saved locally: {studentFallbackPatchCount} student update{studentFallbackPatchCount === 1 ? '' : 's'} are queued because a Supabase write failed.
              {studentFallbackSyncState === 'syncing' ? ' Retrying now...' : ''}
              {studentFallbackSyncState === 'error' ? ' Retry failed for some records. Use retry after confirming Supabase access is restored.' : ''}
            </span>
            <button
              onClick={() => flushStudentFallbackPatches()}
              style={{
                border: '1px solid #eab308',
                background: '#fff7cc',
                color: '#854d0e',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {studentFallbackSyncState === 'syncing' ? 'Retrying...' : 'Retry now'}
            </button>
          </div>
        )}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {divisionOptions.map(option => (
              <button key={option} onClick={() => setDivisionView(option)} style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${divisionView === option ? '#7d99bb' : '#d8e1ec'}`, background: divisionView === option ? '#eaf2fb' : '#ffffff', color: divisionView === option ? '#2f4b68' : '#5b6b7d', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: divisionView === option ? '0 8px 18px rgba(72,105,141,0.12)' : 'none' }}>
                {divisionLabel(option)}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #dde6f0', fontSize: 13, width: 280, background: '#fcfdff', boxShadow: '0 6px 18px rgba(30,41,59,0.04)', outline: 'none' }} />
            {search && (
              <div style={{ position: 'absolute', top: '100%', left: 0, width: 300, background: '#fff', border: '1px solid #e5ebf2', borderRadius: 10, boxShadow: '0 10px 24px rgba(30,41,59,0.10)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                {searchedStudents.slice(0,6).map((s,i) => (
                  <div key={s.id} onClick={() => { if (page === 'store') { setStoreStudent(s.id) } else { openStudent(s) }; setSearch('') }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}
                    onMouseEnter={e => e.currentTarget.style.background='#f6f9fc'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: statusColor[s.status] }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>
                    </div>
                  </div>
                ))}
                {searchedStudents.length === 0 && <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 13 }}>No students found</div>}
                <div onClick={() => setSearch('')} style={{ padding: '8px 14px', fontSize: 11, color: '#94a3b8', cursor: 'pointer', textAlign: 'center', borderTop: '1px solid #f8fafc' }}>✕ Close</div>
              </div>
            )}
          </div>
        </div>

        {page === 'support' && role !== 'store' && (
          <StudentSupport
            students={visibleStudents}
            setStudents={setStudents}
            userName={userName}
            role={role}
            alerts={alerts}
            openStudent={openStudent}
            setPage={setPage}
            flags={studentFlags}
            setFlags={setStudentFlags}
            initialSection={supportInitialSection}
            staff={STAFF}
            FlagsPanel={StudentFlagsPanel}
            S={S}
            initials={initials}
          />
        )}

        {page === 'dashboard' && role === 'teacher' && <TeacherDashboard students={visibleStudents} setStudents={setStudents} userName={userName} setSelectedStudent={s => openStudent(s)} setTeachingMode={setTeachingMode} initialClass={teacherClassIds.length === 1 ? teacherClassIds[0] : null} setDrillDown={setDrillDown} recordStudentPointsAction={recordStudentPointsAction} isVIP={checkIsVIP} />}
        {page === 'dashboard' && role === 'therapist' && <TherapistDashboard students={visibleStudents} userName={userName} setSelectedStudent={s => openStudent(s, 'therapy')} />}

        {page === 'dashboard' && role === 'admin' && isOfficeUser && (
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            {(() => {
              const docKeys = ['applicationForm','birthCertificate','immunization','iepEvaluation','reportCard','schoolRecords','parentQuestionnaire','tuitionPaperwork','emergencyContacts','medicalAllergies']
              const applicants = intakeList || []
              const preLeads = preIntakeList || []

              const accepted = applicants.filter(x => ['Accepted','Accepted with supports','accepted','enrolled'].includes(x.decision || x.status))
              const missingDocApplicants = applicants.filter(x => docKeys.some(k => !x.requiredDocsComplete?.[k]))
              const openFollowUps = applicants.flatMap(x => (x.followUps || []).filter(t => !t.done).map(t => ({ ...t, applicant: x.name })))
              const tours = [
                ...preLeads.filter(x => x.tourDate).map(x => ({ name: x.name, date: x.tourDate, time: x.tourTime, by: x.tourBy || 'Rabbi Baum', type: 'Lead' })),
                ...applicants.filter(x => x.tourDate).map(x => ({ name: x.name, date: x.tourDate, time: x.tourTime, by: x.tourBy || 'Rabbi Baum', type: 'Applicant' }))
              ].slice(0, 6)

              const documentsNeeded = missingDocApplicants.reduce((sum, x) => sum + docKeys.filter(k => !x.requiredDocsComplete?.[k]).length, 0)
              const callsDue = callsDueStudents.slice(0, 5)

              return (
                <>
                  <div style={{ marginBottom: 22, background: '#ffffff', borderRadius: 14, padding: '24px 26px', color: '#223046', boxShadow: '0 8px 22px rgba(30,41,59,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196', marginBottom: 9 }}>Office Command Desk</div>
                        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.045em', color: '#111827' }}>{getGreeting(new Date().getHours())}, {userName}</h1>
                        <p style={{ color: '#64748b', margin: '9px 0 0', fontSize: 13 }}><LiveClock /> · Admissions, calls, documents, and office follow-ups</p>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setPage('intake'); setIntakeSection('pre') }} style={S.btn('primary')}>Open Pre-Intake</button>
                        <button onClick={() => { setPage('intake'); setIntakeSection('applicants') }} style={S.btn('ghost')}>Open Applicants</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
                    <ClickCard label="Pre-Intake Leads" val={preLeads.length} color="#334155" sub="calls, tours, early inquiries" goToPage="intake" />
                    <ClickCard label="Applicants" val={applicants.length} color="#4f6687" sub={`${accepted.length} accepted/enrolled`} goToPage="intake" />
                    <ClickCard label="Missing Docs" val={documentsNeeded} color="#9a3412" sub={`${missingDocApplicants.length} boys need paperwork`} goToPage="intake" />
                    <ClickCard label="Open Follow-Ups" val={openFollowUps.length} color="#7c3aed" sub="office tasks still open" goToPage="intake" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 18 }}>
                    <div style={S.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033' }}>Admissions Office Work Queue</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>What the office should handle next.</div>
                        </div>
                        <button onClick={() => setPage('intake')} style={S.btn('ghost')}>Go to Intake</button>
                      </div>

                      {[
                        { title: 'Collect missing documents', count: documentsNeeded, note: `${missingDocApplicants.length} applicants have incomplete packets`, page: 'intake' },
                        { title: 'Follow up with parents', count: openFollowUps.length, note: 'open intake follow-up tasks', page: 'intake' },
                        { title: 'Parent calls due', count: callsDueStudents.length, note: 'students needing parent contact', page: 'calls' },
                        { title: 'Store low-stock review', count: storeItems.filter(i => (i.stock || 0) <= (i.lowStockAt || 0)).length, note: 'canteen items below threshold', page: 'store' },
                      ].map(item => (
                        <div key={item.title} onClick={() => setPage(item.page)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 9, cursor: 'pointer' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#172033' }}>{item.count}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.note}</div>
                          </div>
                          <div style={{ fontSize: 18, color: '#94a3b8' }}>›</div>
                        </div>
                      ))}
                    </div>

                    <div style={S.card}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 4 }}>Upcoming Tours</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Usually handled by Rabbi Baum or Rabbi Fried.</div>

                      {tours.length === 0 && (
                        <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', color: '#64748b', fontSize: 13 }}>No tours scheduled yet.</div>
                      )}

                      {tours.map(tour => (
                        <div key={`${tour.name}-${tour.date}-${tour.type}`} style={{ padding: '12px 0', borderBottom: '1px solid #eef2f7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#172033' }}>{tour.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{tour.type}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{tour.date}{tour.time ? ` · ${tour.time}` : ''} · {tour.by}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={S.card}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Open Intake Follow-Ups</div>
                      {openFollowUps.slice(0, 6).map(task => (
                        <div key={`${task.applicant}-${task.id}`} style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7' }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{task.text}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{task.applicant} · Due {task.due || 'no date'} · {task.assigned || 'Office'}</div>
                        </div>
                      ))}
                      {openFollowUps.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>No open follow-ups. The office desk is sparkling.</div>}
                    </div>

                    <div style={S.card}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginBottom: 10 }}>Parent Calls Due</div>
                      {callsDue.map(stu => (
                        <div key={stu.id} onClick={() => openStudent(stu, 'calls')} style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{stu.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{stu.className} · parent call follow-up needed</div>
                        </div>
                      ))}
                      {callsDue.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>No parent calls due right now.</div>}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}


        {page === 'setup' && role === 'admin' && (
          <div style={{ maxWidth: 1260, margin: '0 auto' }}>
            {(() => {
              const visiblePeople = SETUP_PEOPLE.filter(person =>
                `${person.name} ${person.specialty}`
                  .toLowerCase()
                  .includes(setupPersonSearch.toLowerCase())
              )

              const currentPerson =
                SETUP_PEOPLE.find(person => person.name === setupPerson) ||
                SETUP_PEOPLE[0]

              const emptyAssignment = {
                periods: {
                  1: [],
                  2: [],
                  3: []
                },
                caseload: []
              }

              const currentAssignment =
                setupAssignments[currentPerson?.name] || emptyAssignment

              const updateCurrentAssignment = updater => {
                if (!currentPerson) return

                setSetupAssignments(previous => {
                  const existing =
                    previous[currentPerson.name] || emptyAssignment

                  const updated = updater(existing)

                  // Persist the changes
                  setTimeout(async () => {
                    await saveSetupAssignment(currentPerson.name, updated)
                  }, 0)

                  return {
                    ...previous,
                    [currentPerson.name]: updated
                  }
                })
              }

              const togglePeriodStudent = async (period, studentId) => {
                if (!currentPerson || currentPerson.type !== 'teacher') {
                  return
                }

                const currentlySelected =
                  (
                    setupAssignments[currentPerson.name]
                      ?.periods?.[period] || []
                  ).includes(studentId)

                const previousAssignments = setupAssignments
                const persistedAssignments = await loadSetupAssignments()
                const baseAssignments =
                  Object.keys(persistedAssignments || {}).length > 0
                    ? {
                        ...setupAssignments,
                        ...persistedAssignments,
                      }
                    : setupAssignments

                const next = { ...baseAssignments }
                const affectedTeachers = [currentPerson.name]

                if (currentlySelected) {
                  const existing =
                    next[currentPerson.name] || emptyAssignment

                  next[currentPerson.name] = {
                    ...existing,
                    periods: {
                      ...existing.periods,
                      [period]:
                        (existing.periods?.[period] || [])
                          .filter(id => id !== studentId)
                    }
                  }
                } else {
                  // Hard enforcement: one teacher per student per period.
                  teacherPeople.forEach(person => {
                    const existing =
                      next[person.name] || emptyAssignment

                    next[person.name] = {
                      ...existing,
                      periods: {
                        ...existing.periods,
                        [period]:
                          (existing.periods?.[period] || [])
                            .filter(id => id !== studentId)
                      }
                    }

                    if (person.name !== currentPerson.name) {
                      affectedTeachers.push(person.name)
                    }
                  })

                  const selectedTeacher =
                    next[currentPerson.name] || emptyAssignment

                  next[currentPerson.name] = {
                    ...selectedTeacher,
                    periods: {
                      ...selectedTeacher.periods,
                      [period]: [
                        ...(selectedTeacher.periods?.[period] || []),
                        studentId
                      ]
                    }
                  }
                }

                setSetupAssignments(next)
                setSetupAssignmentError(null)

                const saveResults = await Promise.all(
                  affectedTeachers.map(teacher =>
                    saveSetupAssignment(teacher, next[teacher])
                  )
                )

                if (!saveResults.every(Boolean)) {
                  setSetupAssignments(previousAssignments)
                  setSetupAssignmentError(
                    'Could not save assignment changes. No assignment updates were kept.'
                  )
                  return
                }
              }

              const toggleCaseloadStudent = studentId => {
                updateCurrentAssignment(existing => {
                  const currentIds = existing.caseload || []
                  const nextIds = currentIds.includes(studentId)
                    ? currentIds.filter(id => id !== studentId)
                    : [...currentIds, studentId]

                  return {
                    ...existing,
                    caseload: nextIds
                  }
                })
              }

              const copyPeriodOneToTwo = () => {
                updateCurrentAssignment(existing => ({
                  ...existing,
                  periods: {
                    ...existing.periods,
                    2: [...(existing.periods?.[1] || [])]
                  }
                }))
              }

              const teacherPeople =
                SETUP_PEOPLE.filter(person => person.type === 'teacher')

              const overlapWarnings = []

              ;[1, 2, 3].forEach(period => {
                const studentTeachers = {}

                teacherPeople.forEach(person => {
                  const ids =
                    setupAssignments[person.name]?.periods?.[period] || []

                  ids.forEach(studentId => {
                    if (!studentTeachers[studentId]) {
                      studentTeachers[studentId] = []
                    }

                    studentTeachers[studentId].push(person.name)
                  })
                })

                Object.entries(studentTeachers).forEach(
                  ([studentId, teacherNames]) => {
                    if (teacherNames.length < 2) return

                    const student = students.find(
                      item => String(item.id) === String(studentId)
                    )

                    overlapWarnings.push({
                      period,
                      studentName: student?.name || `Student ${studentId}`,
                      teacherNames
                    })
                  }
                )
              })

              const filteredSetupStudents = students.filter(student =>
                `${student.name} ${student.className || ''}`
                  .toLowerCase()
                  .includes(setupStudentSearch.toLowerCase())
              )

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
                    <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '18px 18px 10px', borderBottom: '1px solid #e2e8f0' }}>
                        <button
                          onClick={() => setPage('dashboard')}
                          style={{
                            marginBottom: 10,
                            border: '1px solid #dbe7f1',
                            background: '#f8fbff',
                            color: '#31506f',
                            borderRadius: 8,
                            padding: '7px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                          }}
                        >
                          ← Back to dashboard
                        </button>
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196' }}>Setup Center</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#172033', marginTop: 6 }}>Administration & Config</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Tucked-away tools for staff, assignments, rules, and store settings.</div>
                      </div>
                      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {['People & Staff', 'Rules & Configuration', 'School Structure'].map(groupName => {
                          const groupItems = setupNavItems.filter(item => item.group === groupName)
                          if (groupItems.length === 0) return null
                          return (
                            <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196', padding: '2px 4px' }}>{groupName}</div>
                              {groupItems.map(item => {
                                const isActive = setupTab === item.id
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setSetupTab(item.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '10px 12px',
                                      borderRadius: 10,
                                      border: isActive ? '1px solid #7897bb' : '1px solid #e2e8f0',
                                      background: isActive ? '#edf4fb' : '#ffffff',
                                      color: isActive ? '#2f4f72' : '#5f6f81',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                    }}
                                  >
                                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      {setupAssignmentError && (
                    <div style={{
                      ...S.card,
                      marginBottom: 16,
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#991b1b',
                      fontSize: 13,
                      fontWeight: 700,
                    }}>
                      {setupAssignmentError}
                    </div>
                  )}

                      <div style={{ ...S.card, marginBottom: 16, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#708196' }}>
                            Home / Setup Center
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#223046', marginTop: 4 }}>
                            {setupNavItems.find(item => item.id === setupTab)?.label || 'Setup Center'}
                          </div>
                          <div style={{ fontSize: 12, color: '#718096', marginTop: 4, maxWidth: 700 }}>
                            Manage teaching rosters, therapist caseloads, behavior actions, VIP rules, canteen sales, and staff access.
                          </div>
                        </div>
                        <button
                          onClick={() => setPage('dashboard')}
                          style={{
                            border: '1px solid #dbe7f1',
                            background: '#ffffff',
                            color: '#31506f',
                            borderRadius: 999,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ← Back to dashboard
                        </button>
                      </div>

                                    {setupTab === 'staff-directory' && (
                    <StaffDirectoryPage
                      S={S}
                      staffMembers={staffMembers}
                      initials={initials}
                      onStaffChanged={refreshStaffMembers}
                    />
                  )}

                                    {setupTab === 'assignments' && (
                    <SetupAssignmentsSection
                      overlapWarnings={overlapWarnings}
                      S={S}
                      setupPersonSearch={setupPersonSearch}
                      setSetupPersonSearch={setSetupPersonSearch}
                      visiblePeople={visiblePeople}
                      currentPerson={currentPerson}
                      setupAssignments={setupAssignments}
                      emptyAssignment={emptyAssignment}
                      setSetupPerson={setSetupPerson}
                      setupStudentSearch={setupStudentSearch}
                      setSetupStudentSearch={setSetupStudentSearch}
                      currentAssignment={currentAssignment}
                      copyPeriodOneToTwo={copyPeriodOneToTwo}
                      filteredSetupStudents={filteredSetupStudents}
                      togglePeriodStudent={togglePeriodStudent}
                      toggleCaseloadStudent={toggleCaseloadStudent}
                    />
                  )}

                                    {setupTab === 'therapy-schedule' && (
                    <SetupTherapyScheduleSection
                      setupTherapySchedule={setupTherapySchedule}
                      setSetupTherapySchedule={setSetupTherapySchedule}
                      students={students}
                      setupTherapyFilters={setupTherapyFilters}
                      setSetupTherapyFilters={setSetupTherapyFilters}
                      setupTherapyView={setupTherapyView}
                      setSetupTherapyView={setSetupTherapyView}
                      addSetupTherapyFilter={addSetupTherapyFilter}
                      updateSetupTherapyFilter={updateSetupTherapyFilter}
                      removeSetupTherapyFilter={removeSetupTherapyFilter}
                      createFakeTherapySchedule={createFakeTherapySchedule}
                      THERAPIST_OPTIONS={THERAPIST_OPTIONS}
                      CLASSES={CLASSES}
                      STUDENT_CLASSES={STUDENT_CLASSES}
                      CLASS_DIVISION={CLASS_DIVISION}
                      SUPPORT_STAFF_OPTIONS={SUPPORT_STAFF_OPTIONS}
                      S={S}
                    />
                  )}

                                    {setupTab === 'teaching' && (
                    <SetupTeachingConfigSection
                      setupActionDraft={setupActionDraft}
                      setSetupActionDraft={setSetupActionDraft}
                      setSetupCustomActions={setSetupCustomActions}
                      setupCustomActions={setupCustomActions}
                      S={S}
                    />
                  )}

                                    {setupTab === 'classes-divisions' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#223046' }}>Classes & Divisions</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Add, edit, and keep the structure that drives grouping, reporting, and access.</div>
                          </div>
                          <button
                            onClick={resetClassForm}
                            style={{ border: '1px solid #dbe7f1', background: '#ffffff', color: '#31506f', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            + Add Class
                          </button>
                        </div>

                        {showClassEditor && (
                          <form onSubmit={handleSaveClass} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10, background: '#f8fafc' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>{editingClassId ? 'Edit Class' : 'Add Class'}</div>
                            <input
                              value={classForm.name}
                              onChange={event => setClassForm(previous => ({ ...previous, name: event.target.value }))}
                              placeholder="Class name"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <input
                              value={classForm.grade}
                              onChange={event => setClassForm(previous => ({ ...previous, grade: event.target.value }))}
                              placeholder="Grade"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <input
                              value={classForm.teacher}
                              onChange={event => setClassForm(previous => ({ ...previous, teacher: event.target.value }))}
                              placeholder="Teacher"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <select
                              value={classForm.divisionKey}
                              onChange={event => setClassForm(previous => ({ ...previous, divisionKey: event.target.value }))}
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            >
                              {Object.entries(schoolDivisions).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                              ))}
                            </select>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>{editingClassId ? 'Save Class' : 'Create Class'}</button>
                              <button type="button" onClick={() => setShowClassEditor(false)} style={{ ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
                            </div>
                          </form>
                        )}

                        <div style={{ display: 'grid', gap: 8 }}>
                          {schoolClasses.map(cls => (
                            <div key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
                              <div>
                                <div style={{ fontWeight: 800, color: '#223046', fontSize: 13 }}>{cls.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cls.grade || 'Grade pending'}{cls.teacher ? ` · ${cls.teacher}` : ''}</div>
                                <div style={{ fontSize: 11, color: '#4f6687', marginTop: 4 }}>{schoolDivisions[cls.divisionKey]?.label || 'Division pending'}</div>
                              </div>
                              <button onClick={() => startEditClass(cls)} style={{ border: '1px solid #dbe7f1', background: '#f8fbff', color: '#31506f', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#223046' }}>Divisions</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Adjust the division labels and short codes used across the dashboard.</div>
                          </div>
                          <button
                            onClick={resetDivisionForm}
                            style={{ border: '1px solid #dbe7f1', background: '#ffffff', color: '#31506f', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            + Add Division
                          </button>
                        </div>

                        {showDivisionEditor && (
                          <form onSubmit={handleSaveDivision} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10, background: '#f8fafc' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046' }}>{editingDivisionKey ? 'Edit Division' : 'Add Division'}</div>
                            <input
                              value={divisionForm.key}
                              onChange={event => setDivisionForm(previous => ({ ...previous, key: event.target.value }))}
                              placeholder="Internal key (example: yeshiva_ketana)"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <input
                              value={divisionForm.label}
                              onChange={event => setDivisionForm(previous => ({ ...previous, label: event.target.value }))}
                              placeholder="Display label"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <input
                              value={divisionForm.shortLabel}
                              onChange={event => setDivisionForm(previous => ({ ...previous, shortLabel: event.target.value }))}
                              placeholder="Short label"
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #dce4ed' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" style={{ ...S.btn('primary'), padding: '8px 12px', fontSize: 12 }}>{editingDivisionKey ? 'Save Division' : 'Create Division'}</button>
                              <button type="button" onClick={() => setShowDivisionEditor(false)} style={{ ...S.btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
                            </div>
                          </form>
                        )}

                        <div style={{ display: 'grid', gap: 8 }}>
                          {Object.entries(schoolDivisions || {}).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
                              <div>
                                <div style={{ fontWeight: 800, color: '#223046', fontSize: 13 }}>{value.label}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{value.shortLabel} · {key}</div>
                              </div>
                              <button onClick={() => startEditDivision(key, value)} style={{ border: '1px solid #dbe7f1', background: '#f8fbff', color: '#31506f', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                                    {setupTab === 'schedule-setup' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={S.card}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#223046', marginBottom: 6 }}>Schedule Setup</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Use these school-structure settings to keep daily schedules aligned with classes, divisions, and support staff.</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#f8fafc' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046', marginBottom: 4 }}>Daily Scheduling Snapshot</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Active class templates: {CLASSES.length} · Active divisions: {Object.keys(DIVISIONS || {}).length}</div>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#223046', marginBottom: 4 }}>Suggested next steps</div>
                            <ul style={{ margin: 0, paddingLeft: 16, color: '#64748b', fontSize: 12, display: 'grid', gap: 4 }}>
                              <li>Confirm class rosters and division assignments before publishing schedule changes.</li>
                              <li>Review therapy and support coverage from the People & Staff group.</li>
                              <li>Keep school-wide schedule updates in one place for easy review.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                                    {setupTab === 'vip' && (
                    <SetupVipRulesSection
                      setupVipRules={setupVipRules}
                      setSetupVipRules={setSetupVipRules}
                      S={S}
                    />
                  )}

                                    {setupTab === 'store' && (
                    <SetupStoreSalesSection
                      setupSaleDraft={setupSaleDraft}
                      setSetupSaleDraft={setSetupSaleDraft}
                      setSetupSales={setSetupSales}
                      setupSales={setupSales}
                      S={S}
                    />
                  )}

                                    {setupTab === 'accounts' && (
                    <SetupAccountsSection
                      SETUP_PEOPLE={SETUP_PEOPLE}
                      setupAccounts={setupAccounts}
                      setSetupAccounts={setSetupAccounts}
                      S={S}
                    />
                  )}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {page === 'therapists' && role === 'admin' && (
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#172033' }}>Therapist Assignments</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Assign boys to therapists. Therapists see only their own caseload on login.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {THERAPIST_OPTIONS.map(t => (
                    <span key={t.name} style={{ padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 800, color: '#334155' }}>
                      {t.name}: {students.filter(s => s.assignedTherapist === t.name).length}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ display: 'grid', gap: 8 }}>
                {students.map(stu => (
                  <div key={stu.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.4fr', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{stu.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{stu.className}</div>
                    </div>

                    <select value={stu.assignedTherapist || ''} onChange={e => {
                      const therapist = e.target.value
                      setStudents(prev => prev.map(x => x.id === stu.id ? { ...x, assignedTherapist: therapist } : x))
                    }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                      <option value="">No therapist</option>
                      {THERAPIST_OPTIONS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>

                    <select value={stu.therapyFrequency || ''} onChange={e => {
                      const frequency = e.target.value
                      setStudents(prev => prev.map(x => x.id === stu.id ? { ...x, therapyFrequency: frequency } : x))
                    }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                      <option value="">No schedule</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Twice weekly">Twice weekly</option>
                      <option value="As needed">As needed</option>
                    </select>

                    <input value={stu.therapyNotes || ''} onChange={e => {
                      const notes = e.target.value
                      setStudents(prev => prev.map(x => x.id === stu.id ? { ...x, therapyNotes: notes } : x))
                    }} placeholder="Therapy note..." style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {page === 'dashboard' && role === 'admin' && !isOfficeUser && (
          <AdminMainDashboard
            S={S}
            getGreeting={getGreeting}
            userName={userName}
            total={total}
            divisionLabel={divisionLabel}
            divisionView={divisionView}
            LiveClock={LiveClock}
            cameToday={cameToday}
            stillInYeshiva={stillInYeshiva}
            unknown={unknown}
            urgentStudents={urgentStudents}
            setShowUnknownPopup={setShowUnknownPopup}
            userAccess={userAccess}
            divisionSummaries={divisionSummaries}
            DIVISIONS={DIVISIONS}
            inClassrooms={inClassrooms}
            inClassroomsStudents={inClassroomsStudents}
            late={late}
            lateStudents={lateStudents}
            inTherapy={inTherapy}
            withBT={withBT}
            students={students}
            leftEarlyStudents={leftEarlyStudents}
            absentTodayStudents={absentTodayStudents}
            setDrillDown={setDrillDown}
            cameTodayRate={cameTodayRate}
            setPage={setPage}
            callsDueStudents={callsDueStudents}
            alerts={alerts}
            openStudent={openStudent}
            studentFlags={studentFlags}
            setSupportInitialSection={setSupportInitialSection}
            CLASSES={CLASSES}
            STUDENT_CLASSES={STUDENT_CLASSES}
            improved={improved}
            needsAttention={needsAttention}
            vipStudents={vipStudents}
            getImprovement={getImprovement}
            initials={initials}
            todos={todos}
            setTodos={setTodos}
            FlagDashboardWidget={FlagDashboardWidget}
          />
        )}

        {page === 'students' && (
          <StudentsListPage
            searchedStudents={searchedStudents}
            openStudent={openStudent}
            S={S}
            STAFF={STAFF}
            getImprovement={getImprovement}
            isVIP={checkIsVIP}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            daysSince={daysSince}
            initials={initials}
          />
        )}

        {page === 'staff-directory' && role !== 'teacher' && role !== 'rebbe' && (
          <StaffDirectoryPage
            S={S}
            staffMembers={staffMembers}
            initials={initials}
            onStaffChanged={refreshStaffMembers}
          />
        )}

        {page === 'attendance' && (
          <div style={{ maxWidth: 1180, margin: '0 auto 18px' }}>
            <AttendanceReportsPanel
              S={S}
              rows={buildAttendanceReportRows(filteredStudents)}
              attendanceReportOpen={attendanceReportOpen}
              setAttendanceReportOpen={setAttendanceReportOpen}
              attendanceReportView={attendanceReportView}
              setAttendanceReportView={setAttendanceReportView}
              attendanceReportDivision={attendanceReportDivision}
              setAttendanceReportDivision={setAttendanceReportDivision}
              attendanceReportClass={attendanceReportClass}
              setAttendanceReportClass={setAttendanceReportClass}
              attendanceReportStatus={attendanceReportStatus}
              setAttendanceReportStatus={setAttendanceReportStatus}
              attendanceReportStudentId={attendanceReportStudentId}
              setAttendanceReportStudentId={setAttendanceReportStudentId}
              attendanceReportSearch={attendanceReportSearch}
              setAttendanceReportSearch={setAttendanceReportSearch}
              openAttendanceReportWindow={openAttendanceReportWindow}
            />
          </div>
        )}


        {page === 'attendance' && (
          <AttendancePage
            students={visibleStudents}
            setStudents={setStudents}
            role={role}
            userName={userName}
            attFilter={attFilter}
            setAttFilter={setAttFilter}
            filteredStudents={filteredStudents}
            openStudent={openStudent}
            persistStudentFields={persistStudentFields}
            persistStudentFieldsBulk={persistStudentFieldsBulk}
            STAFF={STAFF}
            S={S}
            initials={initials}
            isVIP={checkIsVIP}
            DAYS={DAYS}
            CLASSES={CLASSES}
            STUDENT_CLASSES={STUDENT_CLASSES}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            HISTORICAL_DATA={HISTORICAL_DATA}
          />
        )}

        {page === 'academics' && (
          <AcademicsPage
            students={visibleStudents}
            setStudents={setStudents}
            role={role}
            userName={userName}
            teacherClass={teacherClassIds.length === 1 ? teacherClassIds[0] : null}
            teacherAssignedStudentIds={assignedTeacherStudentIds}
            teacherAssignedClassIds={assignedTeacherClassIds}
            academicTeacherOptions={Array.from(new Set([
              ...Object.keys(ACADEMIC_AREAS),
              ...TEACHING_STAFF_OPTIONS
            ])).sort()}
            openStudent={openStudent}
            S={S}
            CLASSES={CLASSES}
            STUDENT_CLASSES={STUDENT_CLASSES}
            ACADEMIC_AREAS={ACADEMIC_AREAS}
            SKILL_RATINGS={SKILL_RATINGS}
            academicPct={academicPct}
            academicDisplay={academicDisplay}
            academicStatus={academicStatus}
            academicStatusColor={academicStatusColor}
            persistStudentFields={persistStudentFields}
            setupAssignments={setupAssignments}
          />
        )}

        {page === 'schedule' && (
          <SchedulePage
            S={S}
            students={visibleStudents}
            STAFF={STAFF}
            SCHEDULE_PERIODS={SCHEDULE_PERIODS}
            THERAPY_SCHEDULE={THERAPY_SCHEDULE_STATE}
            openStudent={openStudent}
            initials={initials}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
          />
        )}

        {page === 'behavior' && (
          <BehaviorPage
            students={visibleStudents}
            searchedStudents={searchedStudents}
            openStudent={openStudent}
            initials={initials}
            isVIP={checkIsVIP}
            S={S}
            statusColor={statusColor}
            statusEmoji={statusEmoji}
            statusLabel={statusLabel}
            onAdjustPoints={recordStudentPointsAction}
          />
        )}

        {page === 'store' && (
          <TokenStorePage
            S={S}
            userAccess={userAccess}
            showStoreManager={showStoreManager}
            setShowStoreManager={setShowStoreManager}
            storeItems={storeItems}
            updateStoreItem={updateStoreItem}
            adjustStoreStock={adjustStoreStock}
            removeStoreItem={removeStoreItem}
            newStoreItem={newStoreItem}
            setNewStoreItem={setNewStoreItem}
            addStoreItem={addStoreItem}
            storeStudent={storeStudent}
            setStoreStudent={setStoreStudent}
            visibleStudents={visibleStudents}
            isVIP={checkIsVIP}
            students={visibleStudents}
            storeCategoryFilter={storeCategoryFilter}
            setStoreCategoryFilter={setStoreCategoryFilter}
            storeItemSearch={storeItemSearch}
            setStoreItemSearch={setStoreItemSearch}
            buyItem={buyItem}
            purchaseLog={purchaseLog}
            isStoreItemRestrictedForStudent={isStoreItemRestrictedForStudent}
            STORE_CATEGORY_OPTIONS={STORE_CATEGORY_OPTIONS}
            storePersistenceReady={storePersistenceReady}
            storeSyncState={storeSyncState}
            storeLastLoadError={storeLastLoadError}
          />
        )}

                {page === 'alerts' && (
          <AlertsPage
            S={S}
            alerts={alerts}
            students={students}
            openStudent={openStudent}
          />
        )}

        {page === 'calls' && role === 'admin' && (
          <CallsPage
            S={S}
            students={students}
            openStudent={openStudent}
            daysSince={daysSince}
            initials={initials}
          />
        )}

        {page === 'intake' && role === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 Intake / Admissions</h1>
              {intakeSection === 'applicants' && !selectedIntake && (
                <button onClick={() => {
                  const newApp = { id: Date.now(), name: 'New Applicant', dob: '', currentSchool: '', shul: '', heardAbout: '', fatherName: '', fatherPhone: '', motherName: '', motherMaiden: '', motherPhone: '', address: '', program: divisionView === 'yeshiva_ketana' ? 'yeshiva-ketana' : 'mesivta', status: 'applicant', tourDate: '', tourBy: '', interviewDate: '', nextStep: 'Schedule tour', diagnoses: [], issues: '', interviewNotes: '', scores: {}, placements: {}, documents: [] }
                  setIntakeList(prev => [...prev, newApp])
                  setSelectedIntake(newApp)
                  setIntakeTab('info')
                }} style={S.btn('primary')}>+ New Applicant</button>
              )}
              {intakeSection === 'pre' && !selectedPreIntake && (
                <button onClick={() => {
                  const newLead = { id: Date.now(), name: '', phone: '', program: 'mesivta', status: 'call-back', callNotes: '', tourDate: '', tourTime: '', tourBy: 'Rabbi Baum', interviewDate: '', interviewTime: '', followUpNotes: '' }
                  setPreIntakeList(prev => [...prev, newLead])
                  setSelectedPreIntake(newLead)
                }} style={S.btn('primary')}>+ New Lead</button>
              )}
            </div>

            {/* Section tabs */}
            {!selectedIntake && !selectedPreIntake && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setIntakeSection('pre')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'pre' ? '#0f172a' : '#e5e7eb'}`, background: intakeSection === 'pre' ? '#0f172a' : '#fff', color: intakeSection === 'pre' ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📞 Pre-Intake Leads
                  <span style={{ marginLeft: 8, background: intakeSection === 'pre' ? 'rgba(255,255,255,0.2)' : '#f8fafc', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{preIntakeList.length}</span>
                </button>
                <button onClick={() => setIntakeSection('applicants')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'applicants' ? '#0f172a' : '#e5e7eb'}`, background: intakeSection === 'applicants' ? '#0f172a' : '#fff', color: intakeSection === 'applicants' ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📋 Applicants & Interviews
                  <span style={{ marginLeft: 8, background: intakeSection === 'applicants' ? 'rgba(255,255,255,0.2)' : '#f8fafc', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{intakeList.length}</span>
                </button>
              </div>
            )}

            {/* PRE-INTAKE SECTION */}
            {intakeSection === 'pre' && !selectedPreIntake && (
              <div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                  {[
                    ['call-back', '📞 Call Back', preIntakeList.filter(x=>x.status==='call-back').length, '#9f1239'],
                    ['tour-scheduled', '🏫 Tour Scheduled', preIntakeList.filter(x=>x.status==='tour-scheduled').length, '#4f6687'],
                    ['interview-scheduled', '📋 Interview Scheduled', preIntakeList.filter(x=>x.status==='interview-scheduled').length, '#56765f'],
                    ['needs-interview-time', '⏰ Needs Interview Time', preIntakeList.filter(x=>x.status==='needs-interview-time').length, '#9a6a2a'],
                    [null, '🏥 Mesivta / YK', `${preIntakeList.filter(x=>x.program==='mesivta').length} / ${preIntakeList.filter(x=>x.program==='yeshiva-ketana').length}`, '#6d28d9'],
                  ].map(([status, label, val, color]) => {
                    const isClickable = Boolean(status)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (!status) return

                          const section = document.getElementById(`pre-intake-group-${status}`)

                          if (section) {
                            section.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                            })
                          }
                        }}
                        style={{
                          width: '100%',
                          background: '#fff',
                          borderRadius: 10,
                          padding: '14px',
                          border: '1px solid #e2e8f0',
                          borderTop: `3px solid ${color}`,
                          textAlign: 'center',
                          cursor: isClickable ? 'pointer' : 'default',
                          fontFamily: 'inherit',
                          boxShadow: '0 1px 2px rgba(15,23,42,0.02)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          if (!isClickable) return
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 7px 18px rgba(15,23,42,0.09)'
                          e.currentTarget.style.borderColor = color
                        }}
                        onMouseLeave={e => {
                          if (!isClickable) return
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.02)'
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.borderTopColor = color
                        }}
                      >
                        <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          {label}
                        </div>

                        {isClickable && (
                          <div style={{
                            fontSize: 9,
                            color,
                            marginTop: 6,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            View students ↓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Leads list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['call-back', '📞 Calls to Return', '#9f1239'],
                    ['needs-interview-time', '⏰ Needs Interview Time Set', '#9a6a2a'],
                    ['tour-scheduled', '🏫 Tour Scheduled', '#4f6687'],
                    ['interview-scheduled', '📋 Interview Scheduled', '#56765f'],
                  ].map(([status, groupLabel, color]) => {
                    const group = preIntakeList.filter(x => x.status === status)
                    if (group.length === 0) return null
                    return (
                      <div
                        key={status}
                        id={`pre-intake-group-${status}`}
                        style={{
                          scrollMarginTop: 24,
                          paddingTop: 2
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase' }}>{groupLabel} ({group.length})</div>
                        {group.map((lead, i) => (
                          <div key={lead.id} onClick={() => setSelectedPreIntake(lead)}
                            style={{ background: '#fff', border: `1px solid #e2e8f0`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{lead.name || 'Unnamed Lead'}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                📞 {lead.phone} · {lead.program === 'mesivta' ? '🏫 Mesivta' : '📚 Yeshiva Ketana'}
                                {lead.tourDate && ` · Tour: ${lead.tourDate} ${lead.tourTime}`}
                                {lead.interviewDate && ` · Interview: ${lead.interviewDate} ${lead.interviewTime}`}
                              </div>
                              {lead.callNotes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>"{lead.callNotes.slice(0,60)}{lead.callNotes.length > 60 ? '...' : ''}"</div>}
                            </div>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>View →</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PRE-INTAKE PROFILE */}
            {intakeSection === 'pre' && selectedPreIntake && (
              <div>
                <button onClick={() => setSelectedPreIntake(null)} style={{ ...S.btn('ghost'), marginBottom: 16 }}>← Back to leads</button>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <input value={selectedPreIntake.name} onChange={e => { setSelectedPreIntake(p => ({...p, name: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, name: e.target.value} : x)) }} placeholder="Full name..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, width: '100%', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[['mesivta','🏫 Mesivta'],['yeshiva-ketana','📚 Yeshiva Ketana']].map(([val, label]) => (
                          <button key={val} onClick={() => { setSelectedPreIntake(p => ({...p, program: val})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, program: val} : x)) }} style={{ padding: '2px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedPreIntake.program === val ? '#fff' : 'rgba(255,255,255,0.15)', color: selectedPreIntake.program === val ? '#0f172a' : '#fff' }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <input value={selectedPreIntake.phone} onChange={e => { setSelectedPreIntake(p => ({...p, phone: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, phone: e.target.value} : x)) }} placeholder="Phone..." style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 14, width: 160 }} />
                  </div>

                  <div style={{ padding: 20, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Status pipeline */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📍 Status Pipeline</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          ['call-back', '📞 Call Back'],
                          ['tour-scheduled', '🏫 Schedule Tour'],
                          ['needs-interview-time', '⏰ Set Interview Time'],
                          ['interview-scheduled', '📋 Interview Scheduled'],
                          ['move-to-applicant', '✅ Move to Applicants'],
                        ].map(([val, label]) => (
                          <button key={val} onClick={() => {
                            if (val === 'move-to-applicant') {
                              // Move to applicants list
                              const newApp = { id: Date.now(), name: selectedPreIntake.name, dob: '', currentSchool: '', shul: '', heardAbout: 'Pre-intake lead', fatherName: '', fatherPhone: selectedPreIntake.phone, motherName: '', motherMaiden: '', motherPhone: '', address: '', program: selectedPreIntake.program || 'mesivta', status: selectedPreIntake.status === 'tour-scheduled' ? 'tour-scheduled' : selectedPreIntake.status === 'interview-scheduled' ? 'interview-scheduled' : selectedPreIntake.status === 'needs-interview-time' ? 'tour-completed' : 'applicant', tourDate: selectedPreIntake.tourDate || '', tourBy: selectedPreIntake.tourBy || 'Rabbi Baum', interviewDate: selectedPreIntake.interviewDate || '', nextStep: selectedPreIntake.status === 'interview-scheduled' ? 'Prepare interview packet' : selectedPreIntake.status === 'needs-interview-time' ? 'Schedule interview' : selectedPreIntake.status === 'tour-scheduled' ? 'Tour scheduled' : 'Schedule tour', diagnoses: [], issues: selectedPreIntake.callNotes, interviewNotes: '', scores: {}, placements: {}, documents: [] }
                              setIntakeList(prev => [...prev, newApp])
                              setPreIntakeList(prev => prev.filter(x => x.id !== selectedPreIntake.id))
                              setSelectedPreIntake(null)
                              setIntakeSection('applicants')
                              setSelectedIntake(newApp)
                              setIntakeTab('info')
                            } else {
                              setSelectedPreIntake(p => ({...p, status: val}))
                              setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, status: val} : x))
                            }
                          }} style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${selectedPreIntake.status === val ? '#0f172a' : '#e5e7eb'}`, background: selectedPreIntake.status === val ? '#0f172a' : '#fff', color: selectedPreIntake.status === val ? '#fff' : '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Tour & Interview scheduling */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🏫 Tour</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Date</div>
                            <input type="date" value={selectedPreIntake.tourDate} onChange={e => { setSelectedPreIntake(p => ({...p, tourDate: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, tourDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Time</div>
                            <input type="time" value={selectedPreIntake.tourTime} onChange={e => { setSelectedPreIntake(p => ({...p, tourTime: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, tourTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Tour Staff</div>
                            <select value={selectedPreIntake.tourBy || 'Rabbi Baum'} onChange={e => { setSelectedPreIntake(p => ({...p, tourBy: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, tourBy: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}>
                              {TOUR_STAFF_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Interview</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Date</div>
                            <input type="date" value={selectedPreIntake.interviewDate} onChange={e => { setSelectedPreIntake(p => ({...p, interviewDate: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, interviewDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Time</div>
                            <input type="time" value={selectedPreIntake.interviewTime} onChange={e => { setSelectedPreIntake(p => ({...p, interviewTime: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, interviewTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call notes */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📞 Call Notes</div>
                      <textarea value={selectedPreIntake.callNotes} onChange={e => { setSelectedPreIntake(p => ({...p, callNotes: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, callNotes: e.target.value} : x)) }} placeholder="Notes from the call — who called, what was discussed, any concerns..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 90, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>

                    {/* Follow-up notes */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📝 Follow-Up Notes</div>
                      <textarea value={selectedPreIntake.followUpNotes} onChange={e => { setSelectedPreIntake(p => ({...p, followUpNotes: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, followUpNotes: e.target.value} : x)) }} placeholder="Reminders, next steps..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 60, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICANTS SECTION */}
            {intakeSection === 'applicants' && (
            <div>
            
            {(() => {
              const report = getAdmissionsReport(intakeList)
              const nameLine = arr => arr.length ? arr.map(x => x.name).join(', ') : 'None yet'
              return (
                <details style={{ ...S.card, marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                  <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#172033' }}>Admissions Report</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        Click to open accepted counts, names, waitlist, missing documents, and follow-ups.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef4f0', border: '1px solid #b9d7c2', fontSize: 12, fontWeight: 800, color: '#20462b' }}>
                        Mesivta Accepted: {report.acceptedMesivta.length}
                      </span>
                      <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef4f0', border: '1px solid #b9d7c2', fontSize: 12, fontWeight: 800, color: '#20462b' }}>
                        YK Accepted: {report.acceptedYK.length}
                      </span>
                      <span style={{ padding: '8px 12px', borderRadius: 999, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 800, color: '#9a3412' }}>
                        Needs Review: {report.waitlist.length + report.needsInfo.length}
                      </span>
                    </div>
                  </summary>

                  <div style={{ padding: '0 22px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <button onClick={() => window.print()} style={S.btn('ghost')}>Print Report</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: '#eef4f0', border: '1px solid #b9d7c2' }}>
                        <div style={{ fontSize: 11, color: '#2f5d3b', fontWeight: 800 }}>ACCEPTED MESIVTA</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#20462b' }}>{report.acceptedMesivta.length}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#eef4f0', border: '1px solid #b9d7c2' }}>
                        <div style={{ fontSize: 11, color: '#2f5d3b', fontWeight: 800 }}>ACCEPTED YESHIVA KETANA</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#20462b' }}>{report.acceptedYK.length}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>WAITLIST / NEEDS INFO</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#7c2d12' }}>{report.waitlist.length + report.needsInfo.length}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11, color: '#475569', fontWeight: 800 }}>OPEN FOLLOW-UPS</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#172033' }}>{report.openFollowUpsTotal}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Accepted Mesivta Boys</div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.acceptedMesivta)}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Accepted Yeshiva Ketana Boys</div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.acceptedYK)}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Waitlist</div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.waitlist)}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 8 }}>Needs More Information</div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{nameLine(report.needsInfo)}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
                      Missing document items across all applicants: <b>{report.missingDocsTotal}</b> · No decision yet: <b>{report.noDecision.length}</b> · Not a fit: <b>{report.notFit.length}</b>
                    </div>
                  </div>
                </details>
              )
            })()}

            {selectedIntake ? (
              // ── INTAKE PROFILE ──
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => setSelectedIntake(null)} style={S.btn('ghost')}>← Back to list</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(() => {
                      const idx = intakeList.findIndex(x => x.id === selectedIntake.id)
                      const prev = idx > 0 ? intakeList[idx - 1] : null
                      const next = idx >= 0 && idx < intakeList.length - 1 ? intakeList[idx + 1] : null
                      return (
                        <>
                          <button disabled={!prev} onClick={() => prev && setSelectedIntake(prev)} style={{ ...S.btn('ghost'), opacity: prev ? 1 : 0.45, cursor: prev ? 'pointer' : 'not-allowed' }}>← Previous Applicant</button>
                          <button disabled={!next} onClick={() => next && setSelectedIntake(next)} style={{ ...S.btn('primary'), opacity: next ? 1 : 0.45, cursor: next ? 'pointer' : 'not-allowed' }}>Next Applicant →</button>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
                  {/* Header */}
                  <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initials(selectedIntake.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{selectedIntake.name}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {[['applicant','Applied','#4f6687'],['tour-scheduled','Tour Set','#5b6f95'],['tour-completed','Tour Done','#56765f'],['interview-scheduled','Interview Set','#7a633a'],['interviewed','Interviewed','#9a6a2a'],['accepted','Accepted','#56765f'],['enrolled','Enrolled','#334155']].map(([val, label, color]) => (
                          <button key={val} onClick={() => { setSelectedIntake(prev => ({ ...prev, status: val })); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, status: val} : x)) }} style={{ padding: '2px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedIntake.status === val ? color : 'rgba(255,255,255,0.15)', color: '#fff' }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: '#fff', textAlign: 'right' }}>
                      {selectedIntake.dob && <div style={{ fontSize: 13, opacity: 0.8 }}>Age: {new Date().getFullYear() - new Date(selectedIntake.dob).getFullYear()}</div>}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', background: '#ffffff' }}>
                    {[
                      ['info','👤 Info'],
                      ['family','👨‍👩‍👦 Family'],
                      ['assessment','📊 Assessment'],
                      ['checklist','✅ Checklist'],
                      ['followups','⏰ Follow-Ups'],
                      ['contact','☎️ Contact Log'],
                      ['decision','🧭 Decision'],
                      ['templates','✉️ Templates'],
                      ['documents','📁 Documents']
                    ].map(([t, label]) => (
                      <button key={t} onClick={() => setIntakeTab(t)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: intakeTab === t ? 700 : 400, borderBottom: intakeTab === t ? '2px solid #0f172a' : '2px solid transparent', color: intakeTab === t ? '#0f172a' : '#64748b' }}>{label}</button>
                    ))}
                  </div>

                  <div style={{ padding: '20px 24px', background: '#f8fafc' }}>

                    {openIntakeDoc && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <div style={{ width: 'min(760px, 96vw)', maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
                          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 16 }}>{openIntakeDoc.label}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{selectedIntake.name} · Intake File Preview</div>
                            </div>
                            <button onClick={() => setOpenIntakeDoc(null)} style={{ border: 'none', background: '#e2e8f0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontWeight: 700 }}>Close</button>
                          </div>

                          <div style={{ padding: 22 }}>
                            <div style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: 24, background: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 18 }}>
                                <div>
                                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Hadran Academy</div>
                                  <div style={{ fontSize: 12, color: '#64748b' }}>Admissions / Intake Office</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 12, color: '#334155' }}>
                                  <div><b>File:</b> {openIntakeDoc.fileName}</div>
                                  <div><b>Received:</b> {openIntakeDoc.receivedDate}</div>
                                  <div><b>Status:</b> Verified</div>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>STUDENT</div>
                                  <div style={{ fontWeight: 800 }}>{selectedIntake.name}</div>
                                </div>
                                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>PROGRAM</div>
                                  <div style={{ fontWeight: 800 }}>{selectedIntake.program === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta'}</div>
                                </div>
                                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>FATHER</div>
                                  <div style={{ fontWeight: 800 }}>{selectedIntake.fatherName || 'On file'}</div>
                                </div>
                                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>CURRENT SCHOOL</div>
                                  <div style={{ fontWeight: 800 }}>{selectedIntake.currentSchool || 'On file'}</div>
                                </div>
                              </div>

                              <div style={{ fontWeight: 800, marginBottom: 8 }}>Document Notes</div>
                              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                                This is a demo preview for <b>{openIntakeDoc.label}</b>. In the live system, this button would open the actual uploaded PDF or image from secure storage. For the presentation, it shows that the office can click a checklist item and immediately review the file without leaving the applicant profile.
                              </div>

                              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>REVIEWED BY</div>
                                  <div style={{ fontWeight: 800 }}>{openIntakeDoc.reviewedBy}</div>
                                </div>
                                <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>OFFICE ACTION</div>
                                  <div style={{ fontWeight: 800 }}>{openIntakeDoc.action}</div>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                              <button onClick={() => window.print()} style={S.btn('ghost')}>Print Preview</button>
                              <button onClick={() => setOpenIntakeDoc(null)} style={S.btn('primary')}>Done Reviewing</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {intakeTab === 'info' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Basic Information</div>
                          {[
                            ['Full Name', 'name', 'text'],
                            ['Date of Birth', 'dob', 'date'],
                            ['Current School / Yeshiva', 'currentSchool', 'text'],
                            ['Shul Affiliated', 'shul', 'text'],
                            ['How heard about Hadran', 'heardAbout', 'text'],
                          ].map(([label, key, type]) => (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                              <input type={type} value={selectedIntake[key]||''} onChange={e => { setSelectedIntake(prev => ({...prev, [key]: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, [key]: e.target.value} : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Diagnoses</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                              {selectedIntake.diagnoses?.map((d, i) => (
                                <span key={i} style={{ ...S.badge('#5b5f7a','#f5f3ff'), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {d}
                                  <span onClick={() => { const updated = selectedIntake.diagnoses.filter((_,j) => j!==i); setSelectedIntake(prev => ({...prev, diagnoses: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, diagnoses: updated} : x)) }} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
                                </span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input id="diagInput" placeholder="Add diagnosis..." style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { const val = (e.target as HTMLInputElement).value.trim(); const updated = [...(selectedIntake.diagnoses||[]), val]; setSelectedIntake(prev => ({...prev, diagnoses: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, diagnoses: updated} : x)); (e.target as HTMLInputElement).value = '' } }} />
                            </div>
                          </div>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Issues / Background Notes</div>
                            <textarea value={selectedIntake.issues||''} onChange={e => { setSelectedIntake(prev => ({...prev, issues: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, issues: e.target.value} : x)) }} placeholder="Known issues, background..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                          </div>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Interview Notes</div>
                            <textarea value={selectedIntake.interviewNotes||''} onChange={e => { setSelectedIntake(prev => ({...prev, interviewNotes: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, interviewNotes: e.target.value} : x)) }} placeholder="Notes from intake interview..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {intakeTab === 'family' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[['Father', 'father'],['Mother', 'mother']].map(([label, prefix]) => (
                          <div key={prefix} style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{label === 'Father' ? '👨' : '👩'} {label}</div>
                            {[
                              [`${label} Name`, `${prefix}Name`],
                              [`${label} Phone`, `${prefix}Phone`],
                              ...(prefix === 'mother' ? [["Mother's Maiden Name", 'motherMaiden']] : []),
                            ].map(([lbl, key]) => (
                              <div key={key} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{lbl}</div>
                                <input value={selectedIntake[key]||''} onChange={e => { setSelectedIntake(prev => ({...prev, [key]: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, [key]: e.target.value} : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                              </div>
                            ))}
                          </div>
                        ))}
                        <div style={{ ...S.card, gridColumn: 'span 2' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏠 Home Address</div>
                          <input value={selectedIntake.address||''} onChange={e => { setSelectedIntake(prev => ({...prev, address: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, address: e.target.value} : x)) }} placeholder="Full address..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {intakeTab === 'assessment' && (
                      <div>
                        <div style={{ ...S.card, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>📊 Admissions Assessment</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Score each skill from 1–5, then choose the best placement level.</div>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
                              Scale: 1 = Needs Support · 5 = Strong
                            </div>
                          </div>

                          {INTAKE_ASSESSMENT_AREAS.map(section => (
                            <div key={section.section} style={{ marginBottom: 22 }}>
                              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{section.section}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{section.helper}</div>
                              </div>

                              {section.items.map(item => {
                                const val = selectedIntake.scores?.[item.key] || 0
                                const placement = selectedIntake.placements?.[item.key] || ''
                                const color = intakeScoreColor(val)
                                return (
                                  <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '245px 218px 260px 86px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.icon} {item.label}</div>
                                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.35 }}>{item.detail}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 6 }}>
                                      {[1,2,3,4,5].map(n => (
                                        <button key={n} onClick={() => {
                                          const updatedScores = { ...(selectedIntake.scores || {}), [item.key]: n }
                                          setSelectedIntake(prev => ({ ...prev, scores: updatedScores }))
                                          setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, scores: updatedScores } : x))
                                        }} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${val >= n ? color : '#d7dee7'}`, background: val >= n ? (val >= 4 ? '#eef4f0' : val >= 3 ? '#edf2f7' : '#f7f1e8') : '#f8fafc', color: val >= n ? color : '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{n}</button>
                                      ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 6 }}>
                                      {INTAKE_PLACEMENT_LEVELS.map(level => {
                                        const active = placement === level.key
                                        return (
                                          <button key={level.key} onClick={() => {
                                            const updatedPlacements = { ...(selectedIntake.placements || {}), [item.key]: level.key }
                                            setSelectedIntake(prev => ({ ...prev, placements: updatedPlacements }))
                                            setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, placements: updatedPlacements } : x))
                                          }} style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${active ? level.color : '#d7dee7'}`, background: active ? level.bg : '#f8fafc', color: active ? level.color : '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{level.label}</button>
                                        )
                                      })}
                                    </div>

                                    <div style={{ fontSize: 12, fontWeight: 700, color, textAlign: 'right' }}>
                                      {intakeScoreLabel(val)}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>

                        {Object.values(selectedIntake.scores||{}).some(v => v > 0) && (
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Score Summary</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                              {INTAKE_ASSESSMENT_AREAS.flatMap(section => section.items).filter(item => (selectedIntake.scores?.[item.key] || 0) > 0).map(item => {
                                const val = selectedIntake.scores?.[item.key] || 0
                                const pct = val / 5 * 100
                                const color = intakeScoreColor(val)
                                const placement = INTAKE_PLACEMENT_LEVELS.find(level => level.key === selectedIntake.placements?.[item.key])?.label
                                return (
                                  <div key={item.key} style={{ textAlign: 'center' }}>
                                    <div style={{ height: 72, background: '#f7f9fb', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: 5, border: '1px solid #e7edf3' }}>
                                      <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '5px 5px 0 0', transition: 'height 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, lineHeight: 1.2 }}>{item.label.replace('Math: ', '')}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}/5</div>
                                    {placement && <div style={{ fontSize: 9.5, color: '#64748b' }}>{placement}</div>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {intakeTab === 'checklist' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Required Documents</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Track what the office still needs before enrollment.</div>
                          {[
                            ['applicationForm', 'Application form'],
                            ['birthCertificate', 'Birth certificate'],
                            ['immunization', 'Immunization record'],
                            ['iepEvaluation', 'IEP / evaluation'],
                            ['reportCard', 'Report card'],
                            ['schoolRecords', 'Previous school records'],
                            ['parentQuestionnaire', 'Parent questionnaire'],
                            ['tuitionPaperwork', 'Tuition paperwork'],
                            ['emergencyContacts', 'Emergency contacts'],
                            ['medicalAllergies', 'Medical / allergies']
                          ].map(([key, label]) => {
                            const checked = !!selectedIntake.requiredDocsComplete?.[key]
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: checked ? '#eef4f0' : '#fff', border: `1px solid ${checked ? '#b9d7c2' : '#e5e7eb'}`, marginBottom: 7 }}>
                                <input type="checkbox" checked={checked} onChange={() => {
                                  const updatedDocs = { ...(selectedIntake.requiredDocsComplete || {}), [key]: !checked }
                                  setSelectedIntake(prev => ({ ...prev, requiredDocsComplete: updatedDocs }))
                                  setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, requiredDocsComplete: updatedDocs } : x))
                                }} />
                                <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? '#2f5d3b' : '#334155' }}>{label}</span>
                                <span style={{ fontSize: 11, color: checked ? '#2f5d3b' : '#94a3b8' }}>{checked ? 'Received' : 'Missing'}</span>
                                <button disabled={!checked} onClick={() => checked && setOpenIntakeDoc({
                                  key,
                                  label,
                                  fileName: `${selectedIntake.name.replaceAll(' ', '_')}_${label.replaceAll(' ', '_').replaceAll('/', '-')}.pdf`,
                                  receivedDate: selectedIntake.decisionDate || selectedIntake.tourDate || '2026-06-12',
                                  reviewedBy: selectedIntake.approvedBy || 'Eli Bloom',
                                  action: key === 'iepEvaluation' ? 'Route to placement review' : key === 'tuitionPaperwork' ? 'Send to office billing file' : 'Filed in admissions packet'
                                })} style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid #cbd5e1', background: checked ? '#fff' : '#f1f5f9', color: checked ? '#0f172a' : '#94a3b8', cursor: checked ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 700 }}>
                                  Open File
                                </button>
                              </div>
                            )
                          })}
                        </div>

                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Office Snapshot</div>
                          {(() => {
                            const docKeys = ['applicationForm','birthCertificate','immunization','iepEvaluation','reportCard','schoolRecords','parentQuestionnaire','tuitionPaperwork','emergencyContacts','medicalAllergies']
                            const done = docKeys.filter(k => selectedIntake.requiredDocsComplete?.[k]).length
                            const missing = docKeys.length - done
                            const openTasks = (selectedIntake.followUps || []).filter(t => !t.done).length
                            return (
                              <div style={{ display: 'grid', gap: 10 }}>
                                <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}><b>{done}/{docKeys.length}</b> documents received</div>
                                <div style={{ padding: 14, borderRadius: 10, background: missing ? '#fff7ed' : '#eef4f0', border: `1px solid ${missing ? '#fed7aa' : '#b9d7c2'}` }}><b>{missing}</b> missing documents</div>
                                <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}><b>{openTasks}</b> open follow-up tasks</div>
                                <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}><b>{selectedIntake.decision || 'No decision yet'}</b></div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {intakeTab === 'followups' && (
                      <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Follow-Up Tasks</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Office reminders tied to this applicant.</div>
                          </div>
                          <button onClick={() => {
                            const text = prompt('Follow-up task, example: Call mother for IEP')
                            if (!text) return
                            const due = prompt('Due date, example: 2026-06-18') || ''
                            const assigned = prompt('Assigned to, example: Eli Bloom, Zev Reisman, Eli Stern, Rabbi Baum') || 'Office'
                            const updated = [...(selectedIntake.followUps || []), { id: Date.now(), text, due, assigned, done: false }]
                            setSelectedIntake(prev => ({ ...prev, followUps: updated }))
                            setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, followUps: updated } : x))
                          }} style={S.btn('primary')}>+ Add Follow-Up</button>
                        </div>

                        {((selectedIntake.followUps || []).length === 0) && (
                          <div style={{ color: '#94a3b8', fontSize: 13, padding: 18, textAlign: 'center', background: '#f8fafc', borderRadius: 10 }}>No follow-ups yet. Add one for the demo.</div>
                        )}

                        {(selectedIntake.followUps || []).map(task => (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: task.done ? '#f8fafc' : '#fff', marginBottom: 8 }}>
                            <input type="checkbox" checked={!!task.done} onChange={() => {
                              const updated = (selectedIntake.followUps || []).map(t => t.id === task.id ? { ...t, done: !t.done } : t)
                              setSelectedIntake(prev => ({ ...prev, followUps: updated }))
                              setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, followUps: updated } : x))
                            }} />
                            <div style={{ flex: 1, opacity: task.done ? 0.55 : 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{task.text}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Due: {task.due || 'No date'} · Assigned: {task.assigned || 'Office'}</div>
                            </div>
                            <button onClick={() => {
                              const updated = (selectedIntake.followUps || []).filter(t => t.id !== task.id)
                              setSelectedIntake(prev => ({ ...prev, followUps: updated }))
                              setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, followUps: updated } : x))
                            }} style={{ background: 'none', border: 'none', color: '#9f1239', cursor: 'pointer' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {intakeTab === 'contact' && (
                      <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Parent Contact Log</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Every call, email, tour update, and next step in one place.</div>
                          </div>
                          <button onClick={() => {
                            const summary = prompt('Contact summary')
                            if (!summary) return
                            const method = prompt('Method: phone, email, in person') || 'phone'
                            const staff = prompt('Staff name') || 'Office'
                            const updated = [{ id: Date.now(), date: new Date().toISOString().slice(0,10), method, staff, summary }, ...(selectedIntake.contactLogs || [])]
                            setSelectedIntake(prev => ({ ...prev, contactLogs: updated }))
                            setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, contactLogs: updated } : x))
                          }} style={S.btn('primary')}>+ Add Contact Note</button>
                        </div>

                        {((selectedIntake.contactLogs || []).length === 0) && (
                          <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, color: '#64748b', fontSize: 13 }}>No contact notes yet. For the demo, add a parent call note.</div>
                        )}

                        {(selectedIntake.contactLogs || []).map(log => (
                          <div key={log.id} style={{ padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{log.method || 'phone'} · {log.staff || 'Office'}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{log.date}</div>
                            </div>
                            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>{log.summary}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {intakeTab === 'decision' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Decision & Placement</div>

                          {[
                            ['Decision', 'decision', ['No decision yet','Accepted','Accepted with supports','Waitlist','Needs more information','Not a fit']],
                            ['Recommended Division', 'recommendedDivision', ['Mesivta','Yeshiva Ketana','Needs review']],
                            ['Recommended Class', 'recommendedClass', ['Mesivta Shiur Alef','Mesivta Shiur Beis','Yeshiva Ketana Alef','Yeshiva Ketana Beis','Needs assessment']],
                            ['Approved By', 'approvedBy', ['Rabbi Baum','Rabbi Fried','Eli Bloom','Zev Reisman','Eli Stern','Rabbi Klein','Rabbi Hillel','Admissions Committee']]
                          ].map(([label, key, options]) => (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                              <select value={selectedIntake[key] || ''} onChange={e => {
                                setSelectedIntake(prev => ({ ...prev, [key]: e.target.value }))
                                setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, [key]: e.target.value } : x))
                              }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                                <option value="">Choose...</option>
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          ))}

                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Decision Date</div>
                          <input type="date" value={selectedIntake.decisionDate || ''} onChange={e => {
                            setSelectedIntake(prev => ({ ...prev, decisionDate: e.target.value }))
                            setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, decisionDate: e.target.value } : x))
                          }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>

                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Support Services & Notes</div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {['Reading support','Speech','OT','Counseling','Behavior plan','Small group','Transportation review'].map(service => {
                              const active = (selectedIntake.servicesNeeded || []).includes(service)
                              return <button key={service} onClick={() => {
                                const current = selectedIntake.servicesNeeded || []
                                const updated = active ? current.filter(x => x !== service) : [...current, service]
                                setSelectedIntake(prev => ({ ...prev, servicesNeeded: updated }))
                                setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, servicesNeeded: updated } : x))
                              }} style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${active ? '#334155' : '#d8dee9'}`, background: active ? '#172033' : '#fff', color: active ? '#fff' : '#334155', fontSize: 12, cursor: 'pointer' }}>{service}</button>
                            })}
                          </div>

                          <textarea value={selectedIntake.placementNotes || ''} onChange={e => {
                            setSelectedIntake(prev => ({ ...prev, placementNotes: e.target.value }))
                            setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? { ...x, placementNotes: e.target.value } : x))
                          }} placeholder="Placement notes, supports, concerns, transportation, class fit..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 130, boxSizing: 'border-box', resize: 'vertical' }} />
                        </div>
                      </div>
                    )}

                    {intakeTab === 'templates' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          ['Tour Confirmation', `Hello, this is Hadran Academy confirming the tour for ${selectedIntake.name}. We look forward to meeting you and discussing whether Hadran is the right fit.`],
                          ['Missing Documents Request', `Hello, we are continuing the intake process for ${selectedIntake.name}. Please send any missing documents such as application forms, report cards, evaluations, immunization records, and school records.`],
                          ['Interview Confirmation', `Hello, this is Hadran Academy confirming the intake interview for ${selectedIntake.name}. Please bring any recent reports or evaluations that would help us understand the best placement.`],
                          ['Acceptance / Next Step', `We are pleased to share that ${selectedIntake.name} has been accepted to continue the enrollment process at Hadran Academy. The next step is to complete the enrollment packet and any remaining paperwork.`],
                          ['Follow-Up After No Response', `Hello, we are following up regarding ${selectedIntake.name}'s application to Hadran Academy. Please let us know if you would like to continue the intake process.`],
                          ['Enrollment Packet', `Hello, attached is the enrollment packet for ${selectedIntake.name}. Please complete and return it so we can finalize placement and prepare for the school year.`]
                        ].map(([title, body]) => (
                          <div key={title} style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{title}</div>
                            <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, minHeight: 84 }}>{body}</div>
                            <button onClick={() => navigator.clipboard?.writeText(body)} style={{ ...S.btn('ghost'), marginTop: 10 }}>Copy Text</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {intakeTab === 'documents' && (
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📁 Documents & Assessments</div>
                        {selectedIntake.documents?.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>No documents uploaded yet.</div>}
                        {selectedIntake.documents?.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Uploaded: {doc.date}</div>
                            </div>
                            <button onClick={() => { const updated = selectedIntake.documents.filter((_,j) => j!==i); setSelectedIntake(prev => ({...prev, documents: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, documents: updated} : x)) }} style={{ background: 'none', border: 'none', color: '#9f1239', cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                          </div>
                        ))}
                        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Upload a document (file name saved for demo — real uploads need database)</div>
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const newDoc = { name: file.name, date: new Date().toISOString().slice(0,10) }
                              const updated = [...(selectedIntake.documents||[]), newDoc]
                              setSelectedIntake(prev => ({...prev, documents: updated}))
                              setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, documents: updated} : x))
                              e.target.value = ''
                            }
                          }} style={{ fontSize: 13 }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // ── INTAKE LIST ──
              <div>
                {(() => {
                  const admissionStages = [
                    { key: 'applicant', label: 'Applied', color: '#4f6687' },
                    { key: 'tour-scheduled', label: 'Tour Scheduled', color: '#5b6f95' },
                    { key: 'tour-completed', label: 'Tour Completed', color: '#56765f' },
                    { key: 'interview-scheduled', label: 'Interview Scheduled', color: '#7a633a' },
                    { key: 'interviewed', label: 'Interviewed', color: '#9a6a2a' },
                    { key: 'accepted', label: 'Accepted', color: '#56765f' },
                    { key: 'enrolled', label: 'Enrolled', color: '#334155' },
                  ]
                  const statusMeta = Object.fromEntries(admissionStages.map(stage => [stage.key, stage]))
                  const stageIndex = (status) => Math.max(0, admissionStages.findIndex(stage => stage.key === status))
                  const applicantCounts = admissionStages.reduce((acc, stage) => ({ ...acc, [stage.key]: intakeList.filter(x => x.status === stage.key).length }), {})
                  const filteredApplicants = intakeApplicantFilter === 'all' ? intakeList : intakeList.filter(x => x.status === intakeApplicantFilter)

                  return (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {[['all','All', intakeList.length], ...admissionStages.map(stage => [stage.key, stage.label, applicantCounts[stage.key] || 0])].map(([val, label, count]) => {
                          const active = intakeApplicantFilter === String(val)
                          return (
                            <button key={String(val)} onClick={() => setIntakeApplicantFilter(String(val))} style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${active ? '#334155' : '#d8dee9'}`, background: active ? '#172033' : '#ffffff', color: active ? '#ffffff' : '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {label} <span style={{ marginLeft: 6, opacity: active ? 0.78 : 0.65 }}>{count}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.35fr) 130px minmax(220px,1.25fr) minmax(210px,1.2fr) 72px', gap: 12, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <div>Applicant</div>
                          <div>Division</div>
                          <div>Where Up To</div>
                          <div>Next Step</div>
                          <div></div>
                        </div>

                        {filteredApplicants.map((app, i) => {
                          const age = app.dob ? new Date().getFullYear() - new Date(app.dob).getFullYear() : null
                          const meta = statusMeta[app.status] || statusMeta.applicant
                          const activeStage = stageIndex(app.status)
                          const scoreVals = Object.values(app.scores || {}).filter(v => typeof v === 'number' && v > 0)
                          const avgScore = scoreVals.length > 0 ? Math.round(scoreVals.reduce((a,b) => a+b, 0) / scoreVals.length * 10) / 10 : null
                          const programLabel = app.program === 'yeshiva-ketana' ? 'Yeshiva Ketana' : 'Mesivta'
                          const nextStep = app.nextStep || (app.status === 'applicant' ? 'Schedule tour' : app.status === 'tour-scheduled' ? 'Complete tour' : app.status === 'tour-completed' ? 'Schedule interview' : app.status === 'interview-scheduled' ? 'Complete interview' : app.status === 'interviewed' ? 'Admissions decision' : app.status === 'accepted' ? 'Enrollment packet' : 'Add to roster')

                          return (
                            <div key={app.id} onClick={() => { setSelectedIntake(app); setIntakeTab('info') }} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.35fr) 130px minmax(220px,1.25fr) minmax(210px,1.2fr) 72px', gap: 12, alignItems: 'center', padding: '13px 16px', borderBottom: i === filteredApplicants.length - 1 ? 'none' : '1px solid #edf2f7', cursor: 'pointer', background: '#ffffff' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fbfdff'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ffffff'}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials(app.name)}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#172033' }}>{app.name}</div>
                                  <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{age ? `Age ${age}` : 'Age not entered'}{app.currentSchool ? ` · ${app.currentSchool}` : ''}</div>
                                  <div style={{ display: 'flex', gap: 7, marginTop: 4, color: '#64748b', fontSize: 10.5 }}>
                                    {app.diagnoses?.length > 0 && <span>📋 {app.diagnoses.length} diag.</span>}
                                    {app.documents?.length > 0 && <span>📁 {app.documents.length} docs</span>}
                                    {avgScore && <span style={{ fontWeight: 700, color: avgScore >= 4 ? '#56765f' : avgScore >= 3 ? '#9a6a2a' : '#9f1239' }}>⭐ {avgScore}/5</span>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span style={{ ...S.badge(programLabel === 'Mesivta' ? '#4f6687' : '#56765f', programLabel === 'Mesivta' ? '#edf2f7' : '#eef4f0'), fontWeight: 600 }}>{programLabel}</span>
                                {app.shul && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 5 }}>🕍 {app.shul}</div>}
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {admissionStages.map((stage, idx) => (
                                    <span key={stage.key} title={stage.label} style={{ height: 6, flex: 1, maxWidth: 34, borderRadius: 999, background: idx <= activeStage ? stage.color : '#e2e8f0', opacity: idx <= activeStage ? 0.92 : 1 }} />
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 10.5, color: '#64748b' }}>
                                  {app.tourDate && <span>Tour: {app.tourDate}{app.tourBy ? ` with ${app.tourBy}` : ''}</span>}
                                  {app.interviewDate && <span>Interview: {app.interviewDate}</span>}
                                </div>
                              </div>

                              <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.35 }}>
                                {nextStep}
                              </div>

                              <div style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>View →</div>
                            </div>
                          )
                        })}

                        {filteredApplicants.length === 0 && (
                          <div style={{ padding: '36px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No applicants in this stage.</div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
            </div>
            )}
          </div>
        )}

        {page === 'todo' && role === 'admin' && (
          <TodoPage
            S={S}
            todos={todos}
            setTodos={setTodos}
            newTodo={newTodo}
            setNewTodo={setNewTodo}
            newTodoCategory={newTodoCategory}
            setNewTodoCategory={setNewTodoCategory}
            newTodoTime={newTodoTime}
            setNewTodoTime={setNewTodoTime}
          />
        )}

      </div>

      </div>

      {showUnknownPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '84vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(15,23,42,0.28)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #eef0f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#263241' }}>Update Unknown Locations</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Mark each located boy and add an optional note.</div>
              </div>
              <button onClick={() => setShowUnknownPopup(false)} style={{ border: 'none', background: '#f4f5f8', color: '#263241', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </div>
            <div style={{ padding: 18, overflow: 'auto', maxHeight: '68vh' }}>
              {students.filter(s => s.status === 'unknown').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No unknown locations right now.</div>
              )}
              {students.filter(s => s.status === 'unknown').map((s, i) => (
                <div key={s.id} style={{ border: '1px solid #eef0f7', borderRadius: 12, padding: 16, marginBottom: 12, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={S.avatar(i, 36)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#263241' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#9f1239', marginTop: 2 }}>Location unknown</div>
                    </div>
                  </div>
                  <input value={unknownNotes[s.id] || ''} onChange={e => setUnknownNotes(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Optional note, for example: found by office with Rabbi Baum" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e1e7ef', borderRadius: 10, fontSize: 13, marginBottom: 12, outline: 'none' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button onClick={() => updateUnknownLocation(s.id, 'present', 'In Classroom')} style={S.btn('primary')}>Mark In Classroom</button>
                    <button onClick={() => updateUnknownLocation(s.id, 'therapy', 'Therapy')} style={S.btn('purple')}>Mark Therapy</button>
                    <button onClick={() => updateUnknownLocation(s.id, 'with-bt', 'With BT')} style={{ ...S.btn('ghost'), color: '#0369a1' }}>Mark With BT</button>
                    <button onClick={() => updateUnknownLocation(s.id, 'absent', 'Absent')} style={{ ...S.btn('ghost'), color: '#9f1239' }}>Mark Absent</button>
                    <button onClick={() => updateUnknownLocation(s.id, 'left-early', 'Left Early')} style={{ ...S.btn('ghost'), color: '#64748b' }}>Mark Left Early</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {drillDown && (
        <DrillDown
          title={drillDown.title}
          students={drillDown.students
            .map(savedStudent =>
              students.find(currentStudent => currentStudent.id === savedStudent.id)
            )
            .filter(Boolean)
            .filter(student => {
              if (drillDown.title.includes('Absent')) {
                return (student.dailyStatus || student.status) === 'absent'
              }

              if (drillDown.title.includes('Present')) {
                return student.status === 'present'
              }

              return true
            })}
          onClose={() => setDrillDown(null)}
          onSelectStudent={student => {
            openStudent(student)
            setDrillDown(null)
          }}
          isVIP={checkIsVIP}
          staff={STAFF}
          styles={S}
          initials={initials}
          statusColor={statusColor}
          statusEmoji={statusEmoji}
          statusLabel={statusLabel}
        />
      )}
      {selectedStudent && <StudentProfile
        student={selectedStudent}
        students={students}
        setStudents={setStudents}
        onClose={() => setSelectedStudent(null)}
        role={role}
        userName={userName}
        defaultTab={selectedStudentTab}
        S={S}
        STAFF={STAFF}
        DAYS={DAYS}
        statusColor={statusColor}
        statusEmoji={statusEmoji}
        statusLabel={statusLabel}
        initials={initials}
        isVIP={checkIsVIP}
        getImprovement={getImprovement}
        daysSince={daysSince}
        TrackingTab={TrackingTab}
        pointsEvents={selectedStudentPointsEvents}
        onUndoPointsEvent={undoPointsEvent}
        StudentScoresTab={props => (
          <StudentScoresTab
            {...props}
            S={S}
            DEFAULT_ACADEMIC_TEACHER={DEFAULT_ACADEMIC_TEACHER}
            ACADEMIC_AREAS={ACADEMIC_AREAS}
            SKILL_RATINGS={SKILL_RATINGS}
            RATING_SCORE={RATING_SCORE}
            academicTeacherOptions={Array.from(new Set([
              ...Object.keys(ACADEMIC_AREAS),
              ...TEACHING_STAFF_OPTIONS
            ])).sort()}
            academicPct={academicPct}
            academicDisplay={academicDisplay}
            academicStatus={academicStatus}
            academicStatusColor={academicStatusColor}
            persistStudentFields={persistStudentFields}
          />
        )}
        FamilyEditorPopup={FamilyEditorPopup}
        MedicalEditorPopup={MedicalEditorPopup}
        persistStudentFields={persistStudentFields}
      />}
      
      {/* Staff Login Panel */}
      {role === 'admin' && showStaffPanel && (
        <StaffLoginPanel 
          loggedInStaff={loggedInStaff}
          onAddLogin={handleAddStaffLogin}
          onRemoveLogin={handleRemoveStaffLogin}
          onShowManagement={() => setShowStaffManagement(true)}
          onClose={() => setShowStaffPanel(false)}
        />
      )}

      {role === 'admin' && !showStaffPanel && (
        <button
          onClick={() => setShowStaffPanel(true)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 998,
            border: '1px solid #d8dee9',
            background: '#ffffff',
            color: '#334155',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
          }}
          title="Show Logged In Staff panel"
        >
          👥 Show Staff Panel
        </button>
      )}
      
      {/* Staff Management Modal */}
      {role === 'admin' && showStaffManagement && (
        <StaffManagementModal onClose={() => setShowStaffManagement(false)} />
      )}
      
      {/* Login Activity Modal */}
      {role === 'admin' && showLoginActivity && (
        <LoginActivityView onClose={() => setShowLoginActivity(false)} />
      )}
    </div>
  )
}


