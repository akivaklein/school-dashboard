import { useState, useEffect, useMemo, useCallback, useRef, type Dispatch, type SetStateAction, type CSSProperties } from 'react'
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
import SetupCenterPage from './SetupCenterPage'
import AdminOfficeDashboardPage from './AdminOfficeDashboardPage'
import AlertsPage from './AlertsPage'
import CallsPage from './CallsPage'
import StudentsListPage from './StudentsListPage'
import StaffDirectoryPage from './StaffDirectoryPage'
import AttendanceReportsPanel from './AttendanceReportsPanel'
import AdminMainDashboard from './AdminMainDashboard'
import TherapistAssignmentsPage from './TherapistAssignmentsPage'
import IntakePage from './IntakePage'
import { buildReportsOverview } from './reportsUtils'
import {
  applyPointsEventTx,
  listPointsEventsForStudent,
  reversePointsEventTx,
  type PointsEventRecord,
} from '../services/pointsEventsService'
import { applyDailyAttendanceReset } from '../services/attendanceService'
import {
  listStudentFlags,
  replaceStudentFlags,
} from '../services/studentFlagsService'
import {
  adjustStoreItemStockBy,
  createStoreItem,
  listStoreItems,
  listStoreRedemptions,
  formatSupabaseError,
  normalizeStoreItemInput,
  redeemStorePurchaseTx,
  reverseStorePurchaseTx,
  seedStoreItems,
  setStoreItemActive,
  updateStoreItem as saveStoreItem,
} from '../services/storeService'
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  type Todo,
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
  saveSetupAssignment,
  loadTherapySchedule,
  saveTherapySchedule,
  loadStaffAccounts,
  saveStaffAccount,
  loadSetupAssignmentsBundle,
  saveAcademicCatalog,
  type AcademicCatalogConfig,
  type TeachingAction,
  type StoreSale,
} from '../services/setupCenterService'
import {
  loadStaffMembers,
  getStaffByName,
  staffMatchesAnyRole,
  FALLBACK_STAFF_MEMBERS,
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
import {
  cameToSchoolToday,
  getDailyAttendanceStatus,
  isInClassroom,
  isInSchool,
} from '../utils/attendancePresence'
import DrillDown from './dashboard/DrillDown'
import LoginPage from './dashboard/LoginPage'
import { buildLoginAccountRoleLabel } from './dashboard/loginUserSearch'
import TrackingTabView from './dashboard/TrackingTab'
import StaffLoginPanel from './StaffLoginPanel'
import StaffManagementModal from './StaffManagementModal'
import LoginActivityView from './LoginActivityView'
import { getLookupValue } from './dashboardUtils'
import { getRoleNavConfig } from './dashboardNavConfig'

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
  getDashboardContextInfo,
  DAYS,
  TEACHER_CLASS_MAP,
  CLASSES,
  STUDENT_CLASSES,
  DIVISIONS,
  CLASS_DIVISION,
  studentDivision,
  resolveLiveStudentPoints,
  resolveStudentClassId,
  getTeacherAssignedClassIds,
  getTeacherAssignedStudentIds,
  getUserAccess,
  defaultDivisionView,
  divisionLabel,
  SCHEDULE_PERIODS,
  THERAPY_SCHEDULE,
  HISTORICAL_DATA,
  DEMO_STORE_ACTIVITY,
  DEMO_STUDENT_FLAGS,
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

type StudentLike = {
  id?: number | string
  name?: string
  att?: string[]
  lateDetails?: { timeArrived?: string; reason?: string; note?: string }
  classLog?: Array<{ type: string; time: string; note?: string; staffId?: number | string }>
  points?: number
  reminders?: number
  lastWeekReminders?: number
  [key: string]: unknown
}

type StoreItemLike = {
  name?: string
  emoji?: string
  [key: string]: unknown
}

type AttendanceHistoryEntry = {
  date: string
  inMins: number
  outMins: number
  pct: number
  staffName?: string
  [key: string]: unknown
}

type StaffMemberLike = {
  id?: number | string
  name?: string
  role?: string
  [key: string]: unknown
}

type StudentFlagLike = {
  id: string | number
  studentId?: number | string
  goal?: string
  startDate?: string
  endDate?: string
  completed?: boolean
  createdBy?: string
  observations?: Array<{
    id: string | number
    observed: boolean
    note: string
    staffName: string
    date: string
    time: string
  }>
  [key: string]: unknown
}

const intakeScoreLabel = (val: number) => val === 0 ? '—' : val === 1 ? 'Needs Support' : val === 2 ? 'Emerging' : val === 3 ? 'Developing' : val === 4 ? 'Proficient' : 'Strong'
const intakeScoreColor = (val: number) => val >= 4 ? '#56765f' : val >= 3 ? '#5b6f95' : val > 0 ? '#9a6a2a' : '#94a3b8'

function daysSince(dateStr: string) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
function initials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#334155','#475569','#3f4f63','#526070','#5f6c7a','#3f5f68','#5b5f7a','#606f64','#6f6254','#495867','#56616d','#4b6470','#6b6259','#576070','#425466','#6a5d68','#536157','#6a5848','#465a69','#64748b','#596475']

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, entryValue]) => {
    acc[key] = typeof entryValue === 'string' ? entryValue : String(entryValue ?? '')
    return acc
  }, {})
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

function getImprovement(s: { lastWeekReminders: number; reminders: number }) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#56765f', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#56765f', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#9f1239', icon: '📉' }
  return { label: 'Same as last week', color: '#9a6a2a', icon: '➡️' }
}

function isVIP(s: { att: string[]; points: number; reminders: number }, rules: { minimumPoints: number; maximumReminders: number; minimumAttendance: number; requireAll: boolean }) {
  const presentCount = s.att.filter((d: string) => d === 'P').length
  const attPct = s.att.length > 0 ? (presentCount / s.att.length) * 100 : 100
  const checks = [
    s.points >= rules.minimumPoints,
    s.reminders <= rules.maximumReminders,
    attPct >= rules.minimumAttendance,
  ]
  return rules.requireAll ? checks.every(Boolean) : checks.some(Boolean)
}

function isStoreItemRestrictedForStudent(student: StudentLike | null | undefined, item: StoreItemLike | null | undefined) {
  if (!student || !item) return false
  const studentName = (student.name || '').toLowerCase()
  const itemName = (item.name || '').toLowerCase()
  const isChaimGoldberg = studentName === 'goldberg chaim' || studentName === 'chaim goldberg'
  const isCandyItem = itemName.includes('sour') || itemName.includes('candy') || itemName.includes('candies') || itemName.includes('lolly') || item.emoji === '🍬' || item.emoji === '🍭'
  return isChaimGoldberg && isCandyItem
}

const S = {
  app: { fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: 'linear-gradient(180deg, #f4f8fc 0%, #f8fbff 100%)', color: '#223046', display: 'flex', letterSpacing: '-0.01em' },
  sidebar: { width: 244, background: 'linear-gradient(180deg, #23344b 0%, #1d2b3c 100%)', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto', overflowX: 'hidden', boxShadow: '8px 0 24px rgba(31,44,63,0.10)' },
  sidebarLogo: { padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 10, flexShrink: 0 },
  sidebarItem: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderRadius: 10, margin: '3px 10px', background: active ? '#eef4fb' : 'transparent', color: active ? '#223046' : 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: active ? 700 : 500, transition: 'background 0.15s, color 0.15s, transform 0.15s', flexShrink: 0 }),
  main: { marginLeft: 244, padding: '32px 56px 50px 40px', minHeight: '100vh', flex: 1, width: 'calc(100% - 244px)', boxSizing: 'border-box' },
  card: { background: '#ffffff', borderRadius: 16, padding: '22px', boxShadow: '0 12px 30px rgba(15,23,42,0.04)', border: '1px solid #dfe8f2' },
  statCard: (color: string) => ({ background: '#ffffff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 12px 30px rgba(15,23,42,0.04)', border: '1px solid #dfe8f2', borderLeft: `3px solid ${color}` }),
  badge: (color: string, bg: string) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant: keyof typeof buttonVariants) => {
    const map = { primary: ['#48698d','#fff'], danger: ['#a24860','#fff'], ghost: ['#eef3f8','#41556d'], success: ['#5a7a66','#fff'], purple: ['#6b7088','#fff'], gold: ['#8a7245','#fff8df'] } as const
    return { padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1], transition: 'transform 0.15s, box-shadow 0.15s' }
  },
  tag: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + '10', color, border: `1px solid ${color}22` }),
  avatar: (idx: number, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }),
}

const buttonVariants = { primary: true, danger: true, ghost: true, success: true, purple: true, gold: true } as const

// ── TRACKING TAB COMPONENT ────────────────────────────────────────────────────
function FamilyEditorPopup({ s, setStudents, userName }: { s: StudentLike; setStudents: React.Dispatch<React.SetStateAction<StudentLike[]>>; userName: string | null }) {
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

function MedicalEditorPopup({ s, setStudents, userName }: { s: StudentLike; setStudents: React.Dispatch<React.SetStateAction<StudentLike[]>>; userName: string | null }) {
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


function FamilyEditor({ s, setStudents, userName, onCancel = null, onSaved = null }: { s: StudentLike; setStudents: React.Dispatch<React.SetStateAction<StudentLike[]>>; userName: string | null; onCancel?: (() => void) | null; onSaved?: (() => void) | null }) {
  const [f, setF] = useState<Record<string, string>>((s.family as Record<string, string>) || {})

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

function MedicalEditor({ s, setStudents, userName, onCancel = null, onSaved = null }: { s: StudentLike; setStudents: React.Dispatch<React.SetStateAction<StudentLike[]>>; userName: string | null; onCancel?: (() => void) | null; onSaved?: (() => void) | null }) {
  const [m, setM] = useState<Record<string, string>>(() => asStringMap(s.medical))

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
        <textarea placeholder="List allergies (comma-separated), e.g.: peanuts (severe), shellfish (moderate)" value={m.allergiesText||''} onChange={e => setM(prev => ({...prev, allergiesText: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📋 Conditions</div>
        <textarea placeholder="List conditions (comma-separated), e.g.: asthma, diabetes, anxiety" value={m.conditionsText||''} onChange={e => setM(prev => ({...prev, conditionsText: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📝 Last Physical</div>
        <input placeholder="Date of last physical" value={m.lastPhysical||''} onChange={e => setM(prev => ({...prev, lastPhysical: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>📌 Medical Notes</div>
        <textarea placeholder="Any additional medical notes..." value={m.notes||''} onChange={e => setM(prev => ({...prev, notes: e.target.value}))} spellCheck lang="en" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onCancel && <button onClick={onCancel} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>}
        <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
      </div>
    </div>
  )
}


function TeacherDashboard({ students, setStudents, userName, setSelectedStudent, setTeachingMode, initialClass = null, setDrillDown, recordStudentPointsAction, isVIP, staffMembers }: { students: StudentLike[]; setStudents: Dispatch<SetStateAction<StudentLike[]>>; userName: string | null; setSelectedStudent: (student: StudentLike) => void; setTeachingMode: Dispatch<SetStateAction<boolean>>; initialClass?: string | number | null; setDrillDown: Dispatch<SetStateAction<{ title: string; students: StudentLike[] } | null>>; recordStudentPointsAction: (payload: Record<string, unknown>) => Promise<void>; isVIP: (student: StudentLike) => boolean; staffMembers: StaffMemberLike[] }) {
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const currentTimeLabel = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  useEffect(() => {
    setSelectedClass(initialClass)
  }, [initialClass])

  const getStudentClassId = (student: StudentLike) => {
    const studentId = Number(student.id)
    const mappedClass = (STUDENT_CLASSES as Record<string | number, string>)[studentId] || (STUDENT_CLASSES as Record<string | number, string>)[String(student.id)]
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
    ? students.filter((s: StudentLike) => getStudentClassId(s) === selectedClass)
    : students

  const present = classStudents.filter((s: StudentLike) => isInClassroom(s)).length
  const absent = classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'absent').length
  const late = classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'late').length
  const inTherapy = classStudents.filter((s: StudentLike) => s.status === 'therapy').length
  const withBT = classStudents.filter((s: StudentLike) => s.status === 'with-bt').length
  const unknown = classStudents.filter((s: StudentLike) => s.status === 'unknown').length
  const unresolved = classStudents.filter((s: StudentLike) => !isInClassroom(s) && !isInSchool(s) && getDailyAttendanceStatus(s) !== 'absent' && getDailyAttendanceStatus(s) !== 'late').length
  const pulloutStudents = classStudents.filter((s: StudentLike) => ['therapy', 'with-bt', 'unknown'].includes(String(s.status)))
  const currentClassInfo = selectedClass ? CLASSES.find(c => c.id === selectedClass) : null
  const expectedRoster = classStudents.length
  const confirmedInClass = present
  const currentPeriod = SCHEDULE_PERIODS[0]
  const nextPullout = pulloutStudents[0]

  async function quickPoints(id: number | string, amount: number) {
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
  async function quickReminder(id: number | string) {
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
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#16243a' }}>{userName ? `Good afternoon, ${userName}` : 'Teacher Dashboard'}</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>{todayLabel} · {currentTimeLabel}</p>
          </div>
          <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('primary'), padding: '8px 16px', fontSize: 13 }}>▶ Start Class Session</button>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#16243a' }}>{currentClassInfo?.name || 'Current Class'}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {currentPeriod?.subject || 'Class period'} · {currentPeriod?.time || 'Today'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...S.badge('#0f766e', '#ccfbf1') }}>{expectedRoster} expected</span>
            <span style={{ ...S.badge('#2563eb', '#dbeafe') }}>{confirmedInClass} confirmed</span>
            <span style={{ ...S.badge('#9a6a2a', '#fef3c7') }}>{absent + late} absent/late</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        {([
          ['Confirmed', confirmedInClass, '#4f6687', classStudents.filter((s: StudentLike) => isInClassroom(s))],
          ['Absent', absent, '#9f1239', classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'absent')],
          ['Late', late, '#9a6a2a', classStudents.filter((s: StudentLike) => getDailyAttendanceStatus(s) === 'late')],
          ['Pullouts', inTherapy + withBT, '#6d28d9', pulloutStudents],
          ['Unknown', unknown, '#9f1239', classStudents.filter((s: StudentLike) => s.status === 'unknown')],
          ['Unresolved', unresolved, '#334155', classStudents.filter((s: StudentLike) => !isInClassroom(s) && !isInSchool(s) && getDailyAttendanceStatus(s) !== 'absent' && getDailyAttendanceStatus(s) !== 'late')],
        ] as Array<[string, number, string, StudentLike[]]>).map(([label, val, color, filtered]) => (
          <div key={label} onClick={() => filtered.length > 0 && setDrillDown({ title: `${label}`, students: filtered })}
            style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0', textAlign: 'center', borderTop: `3px solid ${color}`, cursor: filtered.length > 0 ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (filtered.length > 0) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🧭 Class timeline</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Expected roster · pullouts · returns</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Now</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{expectedRoster} expected</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{confirmedInClass} in class · {absent} absent · {late} late</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Next pullout</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{nextPullout ? nextPullout.name : 'No pullouts scheduled'}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{nextPullout ? `${nextPullout.status} · ${nextPullout.withStaff || 'provider pending'}` : 'All students accounted for'}</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Today</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16243a', marginTop: 4 }}>{currentPeriod?.subject || 'Class period'}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{currentPeriod?.time || 'Schedule available in the School Day view'}</div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 {selectedClass ? CLASSES.find(c=>c.id===selectedClass)?.name : 'Class roster'} · Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {classStudents.map((s: StudentLike, i: number) => {
            const withStaffObj = s.withStaff ? STAFF.find((st: StaffMemberLike) => st.id === s.withStaff) : null
            const vip = isVIP ? isVIP(s) : false
            const studentName = typeof s.name === 'string' ? s.name : 'Student'
            const studentStatus = typeof s.status === 'string' ? s.status : 'present'
            const attendanceStatus = getDailyAttendanceStatus(s)
            const shouldShowPullout = ['therapy', 'with-bt', 'unknown'].includes(String(studentStatus))
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : studentStatus === 'unknown' ? '#fef2f2' : '#ffffff', border: `1px solid ${vip ? '#ca8a04' : studentStatus === 'unknown' ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(studentName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{studentName}{vip && ' ⭐'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ ...S.tag(statusColor[studentStatus as keyof typeof statusColor]), fontSize: 10 }}>{statusEmoji[studentStatus as keyof typeof statusEmoji]}</span>
                      <span style={{ ...S.tag('#64748b', '#f8fafc'), fontSize: 10 }}>{attendanceStatus}</span>
                      {shouldShowPullout && <span style={{ ...S.tag('#7c3aed', '#f5f3ff'), fontSize: 10 }}>Pullout</span>}
                      {withStaffObj && <span style={{ fontSize: 10, color: '#3f6b76', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points ?? 0} pts</span>
                  {(typeof s.reminders === 'number' ? s.reminders : 0) > 0 && <span style={S.badge('#9f1239', '#fee2e2')}>⚠️ {typeof s.reminders === 'number' ? s.reminders : 0}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => quickPoints(s.id, 2)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#4b6854', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => quickPoints(s.id, 5)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#4b6854', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
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

function TherapistDashboard({ students, userName, setSelectedStudent, staffMembers, therapySchedule }: { students: StudentLike[]; userName: string | null; setSelectedStudent: (student: StudentLike) => void; staffMembers: StaffMemberLike[]; therapySchedule: Array<{ day?: string; student?: string; type?: string; duration?: string; time?: string; staffId?: number | string }> }) {
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
            const studentStatus = typeof s.status === 'string' ? s.status : 'present'
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div style={S.avatar(i, 36)}>{initials(studentName)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{studentName}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={S.tag(statusColor[studentStatus as keyof typeof statusColor])}>{statusEmoji[studentStatus as keyof typeof statusEmoji]} {statusLabel[studentStatus as keyof typeof statusLabel]}</span>
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

function StudentFlagsPanel({
  students,
  flags,
  setFlags,
  currentStaffName
}: {
  students: StudentLike[]
  flags: StudentFlagLike[]
  setFlags: Dispatch<SetStateAction<StudentFlagLike[]>>
  currentStaffName: string | null
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [expandedId, setExpandedId] = useState<string | number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [studentId, setStudentId] = useState<string | number>(students[0]?.id || '')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [observed, setObserved] = useState('yes')
  const [note, setNote] = useState('')
  const [staffName, setStaffName] = useState(currentStaffName || 'Staff Member')

  const studentName = (id: number | string) =>
    students.find((student: StudentLike) => Number(student.id) === Number(id))?.name ||
    'Unknown Student'

  const normalizedFlags = flags.map((flag: StudentFlagLike) => ({
    ...flag,
    completed: Boolean(flag.completed || (flag.endDate || '') < today)
  }))

  const activeFlags = normalizedFlags
    .filter((flag: StudentFlagLike) => !flag.completed)
    .sort((a: StudentFlagLike, b: StudentFlagLike) => String(a.endDate || '').localeCompare(String(b.endDate || '')))

  const completedFlags = normalizedFlags
    .filter((flag: StudentFlagLike) => flag.completed)
    .sort((a: StudentFlagLike, b: StudentFlagLike) => String(b.endDate || '').localeCompare(String(a.endDate || '')))

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

  const addObservation = (flagId: string | number) => {
    if (!staffName.trim()) return

    setFlags(previous =>
      previous.map((flag: StudentFlagLike) =>
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

  const renderFlag = (flag: StudentFlagLike, completed = false) => {
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

function FlagDashboardWidget({ flags, onOpen }: { flags: StudentFlagLike[]; onOpen: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const inSevenDays = new Date()
  inSevenDays.setDate(inSevenDays.getDate() + 7)
  const sevenDayIso = inSevenDays.toISOString().slice(0, 10)

  const active = flags.filter((flag: StudentFlagLike) => !flag.completed && (flag.endDate || '') >= today)
  const dueSoon = active.filter((flag: StudentFlagLike) => (flag.endDate || '') <= sevenDayIso)
  const observationsToday = active.reduce(
    (sum: number, flag: StudentFlagLike) =>
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
const DASHBOARD_NAV_STATE_STORAGE_KEY = 'schoolDashboardNavStateV1'
const STUDENT_PROFILE_TAB_STORAGE_KEY = 'schoolDashboardStudentProfileTab'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function readDashboardNavState(): {
  majorSection?: string
  currentPage?: string
  divisionView?: string
} {
  try {
    const raw = localStorage.getItem(DASHBOARD_NAV_STATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function readStoredStudentProfileTab(): string {
  try {
    const tab = localStorage.getItem(STUDENT_PROFILE_TAB_STORAGE_KEY)
    return tab || 'overview'
  } catch {
    return 'overview'
  }
}

export default function Dashboard({ teacherUser, onTeacherSessionLogout }: DashboardProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('admin')
  const [userName, setUserName] = useState('')
  const [loggedInStaff, setLoggedInStaff] = useState<StaffMemberLike[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [activeSessionIds, setActiveSessionIds] = useState<Record<number, number>>({})
  const [showStaffManagement, setShowStaffManagement] = useState(false)
  const [showStaffPanel, setShowStaffPanel] = useState(false)
  const [showLoginActivity, setShowLoginActivity] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [pageTransition, setPageTransition] = useState<'idle' | 'enter'>('idle')
  const [students, setStudents] = useState<StudentLike[]>(() => initialStudents.slice() as StudentLike[])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null)
  const [studentFallbackPatchCount, setStudentFallbackPatchCount] = useState(() => getStudentFallbackPatchCount())
  const [studentFallbackSyncState, setStudentFallbackSyncState] = useState('idle')
  const [staffMembers, setStaffMembers] = useState<StaffMemberLike[]>(FALLBACK_STAFF_MEMBERS as StaffMemberLike[])
  const [staffLoadError, setStaffLoadError] = useState<string | null>(null)
  const fallbackSyncInFlightRef = useRef(false)
  const storePurchaseAttemptKeysRef = useRef<Record<string, string>>({})
  const navRestoreAppliedRef = useRef(false)
  const shouldRestoreNavRef = useRef(false)
  const lastSchoolDayPageRef = useRef('attendance')
  const skipNextStudentFlagsPersistRef = useRef(false)
  const skipInitialAcademicCatalogSaveRef = useRef(true)
  const [realtimeNotice, setRealtimeNotice] = useState<{ scope: string; at: number } | null>(null)

  const markRealtimeNotice = useCallback((scope: string) => {
    setRealtimeNotice({ scope, at: Date.now() })
  }, [])

  useEffect(() => {
    if (!realtimeNotice) return

    const timeoutId = window.setTimeout(() => {
      setRealtimeNotice(null)
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [realtimeNotice])

  const studentIdsFilter = useMemo(() => {
    const ids = (students || [])
      .map(student => Number(student.id))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)

    if (ids.length === 0) return ''
    return `id=in.(${ids.join(',')})`
  }, [students])

  const toPurchaseLogEntry = useCallback((row: Record<string, unknown>) => ({
    id: Number(row.id),
    time: new Date(String(row.created_at || new Date().toISOString())).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    studentId: row.student_id === null ? null : Number(row.student_id),
    studentName: String(row.student_name || ''),
    itemName: String(row.item_name || ''),
    cost: Number(row.cost || 0),
    staff: String(row.staff_name || ''),
    division: String((row.metadata as Record<string, unknown> | null)?.division || ''),
  }), [])

  const applyStudentRealtimeRow = useCallback((previous: StudentLike[], row: Record<string, unknown>) => {
    const rowId = Number(row.id)
    if (!Number.isFinite(rowId)) return previous

    const nextRow = {
      ...row,
      dailyStatus: row.daily_status ?? row.dailyStatus,
      withStaff: row.with_staff ?? row.withStaff,
      lateDetails: row.late_details ?? row.lateDetails,
      behaviorLog: row.behavior_log ?? row.behaviorLog,
      parentCalls: row.parent_calls ?? row.parentCalls,
      testScores: row.test_scores ?? row.testScores,
      classLog: row.class_log ?? row.classLog,
      att: row.attendance ?? row.att,
      points: resolveLiveStudentPoints(row.token_balance),
      token_balance: resolveLiveStudentPoints(row.token_balance),
    }

    const rowForStudent = {
      ...nextRow,
      att: Array.isArray(nextRow.att) ? nextRow.att : [],
      notes: Array.isArray(nextRow.notes) ? nextRow.notes : [],
      behaviorLog: Array.isArray(nextRow.behaviorLog) ? nextRow.behaviorLog : [],
      parentCalls: Array.isArray(nextRow.parentCalls) ? nextRow.parentCalls : [],
      testScores: Array.isArray(nextRow.testScores) ? nextRow.testScores : [],
      classLog: Array.isArray(nextRow.classLog) ? nextRow.classLog : [],
    }

    const existingIndex = previous.findIndex(student => Number(student.id) === rowId)
    if (existingIndex === -1) {
      const initialStudent = initialStudents.find(student => Number(student.id) === rowId)
      const base = initialStudent
        ? { ...initialStudent }
        : {
            id: rowId,
            name: String(row.name || `Student ${rowId}`),
            points: 0,
            reminders: 0,
            status: 'present',
            dailyStatus: 'present',
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
          }

      return [...previous, { ...base, ...rowForStudent }]
    }

    return previous.map(student => (
      Number(student.id) === rowId
        ? { ...student, ...rowForStudent }
        : student
    ))
  }, [])

  const refreshStaffMembers = useCallback(async () => {
    try {
      setStaffLoadError(null)
      const members = await loadStaffMembers()
      const nextMembers = Array.isArray(members) && members.length > 0 ? members : FALLBACK_STAFF_MEMBERS
      setStaffMembers(nextMembers)
    } catch (error) {
      console.error('Unable to load staff members:', error)
      setStaffLoadError('Unable to load staff members.')
      setStaffMembers(FALLBACK_STAFF_MEMBERS)
    }
  }, [])

  useEffect(() => {
    setPageTransition('enter')
    const timer = window.setTimeout(() => setPageTransition('idle'), 180)
    return () => window.clearTimeout(timer)
  }, [page])

  // Auto-login with teacher portal user info
  useEffect(() => {
    if (teacherUser && !loggedIn) {
      handleLogin(teacherUser.role, teacherUser.name, { restoreNavigation: true })
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
              therapyAssignments: [],
              assignedTherapist: '',
              therapyFrequency: '',
              therapyNotes: '',
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

        merged.points = resolveLiveStudentPoints(databaseStudent.token_balance)

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

        if (Object.prototype.hasOwnProperty.call(databaseStudent, 'therapy_assignments')) {
          if (Array.isArray(databaseStudent.therapy_assignments)) {
            merged.therapyAssignments = databaseStudent.therapy_assignments
          }
        } else if (Array.isArray(databaseStudent.therapyAssignments)) {
          merged.therapyAssignments = databaseStudent.therapyAssignments
        }

        merged.assignedTherapist =
          databaseStudent.assigned_therapist ??
          databaseStudent.assignedTherapist ??
          merged.assignedTherapist ??
          ''

        merged.therapyFrequency =
          databaseStudent.therapy_frequency ??
          databaseStudent.therapyFrequency ??
          merged.therapyFrequency ??
          ''

        merged.therapyNotes =
          databaseStudent.therapy_notes ??
          databaseStudent.therapyNotes ??
          merged.therapyNotes ??
          ''

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

  const [studentFlags, setStudentFlags] = useState<StudentFlagLike[]>(() =>
    DEMO_STUDENT_FLAGS.map(flag => ({ ...flag, observations: Array.isArray(flag.observations) ? [...flag.observations] : [] } as StudentFlagLike)),
  )
  const [studentFlagsLoaded, setStudentFlagsLoaded] = useState(false)
  const [studentFlagsPersistenceReady, setStudentFlagsPersistenceReady] = useState(false)
  const [supportInitialSection, setSupportInitialSection] = useState('overview')

  useEffect(() => {
    let active = true

    async function loadStudentFlags() {
      try {
        const flags = await listStudentFlags()
        if (active && flags.length > 0) {
          skipNextStudentFlagsPersistRef.current = true
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
    if (skipNextStudentFlagsPersistRef.current) {
      skipNextStudentFlagsPersistRef.current = false
      return
    }

    replaceStudentFlags(studentFlags).catch(error => {
      console.error('Unable to save student flags to Supabase:', error)
    })
  }, [studentFlags, studentFlagsLoaded, studentFlagsPersistenceReady])

  useEffect(() => {
    if (!studentsLoaded || !studentIdsFilter) return

    const studentsChannel = supabase
      .channel('students-shared')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: studentIdsFilter,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            const removedId = Number((payload.old as Record<string, unknown> | null)?.id)
            if (!Number.isFinite(removedId)) return
            setStudents(prev => prev.filter(student => Number(student.id) !== removedId))
            markRealtimeNotice('students')
            return
          }

          const row = (payload.new || payload.old) as Record<string, unknown>
          if (!row) return
          setStudents(prev => applyStudentRealtimeRow(prev, row))
          markRealtimeNotice('students')
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: students-shared')
        }
      })

    return () => {
      supabase.removeChannel(studentsChannel)
    }
  }, [studentsLoaded, studentIdsFilter, applyStudentRealtimeRow, markRealtimeNotice])

  useEffect(() => {
    if (!studentsLoaded) return

    const flagsChannel = supabase
      .channel('student-flags-shared')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_flags',
        },
        payload => {
          const oldRow = payload.old as Record<string, unknown> | null
          const newRow = payload.new as Record<string, unknown> | null
          const oldId = String(oldRow?.id || '')

          if (payload.eventType === 'DELETE') {
            setStudentFlags(prev => prev.filter(flag => String(flag.id) !== oldId))
            skipNextStudentFlagsPersistRef.current = true
            markRealtimeNotice('flags')
            return
          }

          if (!newRow) return

          const nextFlag = {
            ...((newRow.payload as Record<string, unknown> | null) || {}),
            id: String(newRow.id || ''),
            studentId: newRow.student_id == null ? null : Number(newRow.student_id),
          }

          setStudentFlags(prev => {
            const next = prev.filter(flag => String(flag.id) !== String(nextFlag.id))
            return [...next, nextFlag as StudentFlagLike]
          })
          skipNextStudentFlagsPersistRef.current = true
          markRealtimeNotice('flags')
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: student-flags-shared')
        }
      })

    return () => {
      supabase.removeChannel(flagsChannel)
    }
  }, [studentsLoaded, markRealtimeNotice])

  useEffect(() => {
    if (!studentsLoaded) return

    const redemptionsChannel = supabase
      .channel('store-redemptions-shared')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_redemptions',
        },
        payload => {
          const oldRow = payload.old as Record<string, unknown> | null
          const newRow = payload.new as Record<string, unknown> | null
          const oldId = Number(oldRow?.id)

          if (payload.eventType === 'DELETE') {
            if (!Number.isFinite(oldId)) return
            setPurchaseLog(prev => prev.filter(entry => Number(entry.id) !== oldId))
            markRealtimeNotice('store')
            return
          }

          if (!newRow) return

          const nextEntry = toPurchaseLogEntry(newRow)
          setPurchaseLog(prev => {
            const merged = [nextEntry, ...prev.filter(entry => Number(entry.id) !== Number(nextEntry.id))]
            return merged
              .sort((a, b) => Number(b.id) - Number(a.id))
              .slice(0, 25)
          })
          markRealtimeNotice('store')
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: store-redemptions-shared')
        }
      })

    const storeItemsChannel = supabase
      .channel('store-items-shared')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_items',
        },
        payload => {
          const oldRow = payload.old as Record<string, unknown> | null
          const newRow = payload.new as Record<string, unknown> | null
          const oldId = Number(oldRow?.id)

          if (payload.eventType === 'DELETE') {
            if (!Number.isFinite(oldId)) return
            setStoreItems(prev => prev.filter(item => Number(item.id) !== oldId))
            markRealtimeNotice('store')
            return
          }

          if (!newRow) return
          if (newRow.active === false) {
            setStoreItems(prev => prev.filter(item => Number(item.id) !== Number(newRow.id)))
            markRealtimeNotice('store')
            return
          }

          const nextItem = {
            id: Number(newRow.id),
            name: String(newRow.name || ''),
            category: String(newRow.category || 'nosh'),
            cost: Number(newRow.cost || 0),
            emoji: String(newRow.emoji || ''),
            vip: !!newRow.vip,
            stock: Number(newRow.stock || 0),
            lowStockAt: Number(newRow.low_stock_at || 0),
            imageUrl: String(newRow.image_url || ''),
            active: true,
          }

          setStoreItems(prev => {
            const withoutCurrent = prev.filter(item => Number(item.id) !== Number(nextItem.id))
            const merged = [...withoutCurrent, nextItem as StoreItemLike]
            return merged.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
          })
          markRealtimeNotice('store')
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime channel error: store-items-shared')
        }
      })

    return () => {
      supabase.removeChannel(redemptionsChannel)
      supabase.removeChannel(storeItemsChannel)
    }
  }, [studentsLoaded, toPurchaseLogEntry, markRealtimeNotice])

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
  const [selectedStudent, setSelectedStudent] = useState<StudentLike | null>(null)
  const [selectedStudentTab, setSelectedStudentTab] = useState(() => readStoredStudentProfileTab())
  const [selectedStudentPointsEvents, setSelectedStudentPointsEvents] = useState<PointsEventRecord[]>([])

  useEffect(() => {
    if (!selectedStudent?.id) return

    const selectedStudentId = Number(selectedStudent.id)
    if (!Number.isFinite(selectedStudentId)) return

    const selectedPointsChannel = supabase
      .channel(`points-events-student-${selectedStudentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_events',
          filter: `student_id=eq.${selectedStudentId}`,
        },
        payload => {
          const oldRow = payload.old as Record<string, unknown> | null
          const newRow = payload.new as Record<string, unknown> | null
          const oldId = Number(oldRow?.id)

          if (payload.eventType === 'DELETE') {
            if (!Number.isFinite(oldId)) return
            setSelectedStudentPointsEvents(prev => prev.filter(event => Number(event.id) !== oldId))
            markRealtimeNotice('points')
            return
          }

          if (!newRow) return

          setSelectedStudentPointsEvents(prev => {
            const next = [
              newRow as PointsEventRecord,
              ...prev.filter(event => Number(event.id) !== Number(newRow.id)),
            ]
            return next.sort((a, b) => {
              const aTime = new Date(a.created_at).getTime()
              const bTime = new Date(b.created_at).getTime()
              if (aTime === bTime) return Number(b.id) - Number(a.id)
              return bTime - aTime
            })
          })
          markRealtimeNotice('points')
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Supabase realtime channel error: points-events-student-${selectedStudentId}`)
        }
      })

    return () => {
      supabase.removeChannel(selectedPointsChannel)
    }
  }, [selectedStudent, markRealtimeNotice])

  const [storeStudent, setStoreStudent] = useState<StudentLike | null>(null)
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('all')
  const [storeItemSearch, setStoreItemSearch] = useState('')
  const [storeItems, setStoreItems] = useState<StoreItemLike[]>(() => STORE_ITEMS.slice() as StoreItemLike[])
  const [purchaseLog, setPurchaseLog] = useState<Array<{ id: number | string; time: string; studentId: number | null; studentName: string; itemName: string; cost: number; staff: string; division: string }>>([])
  const [storePersistenceReady, setStorePersistenceReady] = useState(false)
  const [storeSyncState, setStoreSyncState] = useState('loading')
  const [storeLastLoadError, setStoreLastLoadError] = useState('')
  const [showStoreManager, setShowStoreManager] = useState(false)
  const [newStoreItem, setNewStoreItem] = useState({ name: '', cost: '', stock: '', lowStockAt: '5', emoji: '', category: 'nosh', vip: false })
  const [attFilter, setAttFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [teachingMode, setTeachingMode] = useState(false)
  const [teacherClass, setTeacherClass] = useState<string | number | null>(null)
  const [teacherClassIds, setTeacherClassIds] = useState<Array<string | number>>([])
  const [divisionView, setDivisionView] = useState('all')
  const [drillDown, setDrillDown] = useState<{ title: string; students: StudentLike[] } | null>(null)
  const [showUnknownPopup, setShowUnknownPopup] = useState(false)
  const [unknownNotes, setUnknownNotes] = useState<Record<string, string>>({})

  // Open a student profile with optional tab
  const openStudent = (student: StudentLike, tab = 'overview') => {
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
        const fallbackClassId = teacherClass || TEACHER_CLASS_MAP[userName as keyof typeof TEACHER_CLASS_MAP] || null
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

  const refreshStoreData = useCallback(async () => {
    try {
      setStoreSyncState('loading')
      setStoreLastLoadError('')

      let loadedItems = await listStoreItems()

      if (loadedItems.length === 0) {
        await seedStoreItems(STORE_ITEMS)
        loadedItems = await listStoreItems()
      }

      const loadedRedemptions = await listStoreRedemptions(25)
      const useDemoActivity = shouldUseDemoStoreActivity({
        hasPersistedItems: loadedItems.length > 0,
        hasPersistedRedemptions: loadedRedemptions.length > 0,
      })

      setStoreItems(loadedItems.length > 0 ? loadedItems : STORE_ITEMS.slice())
      setPurchaseLog(
        useDemoActivity
          ? DEMO_STORE_ACTIVITY.slice()
          : loadedRedemptions.map(redemption => ({
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
      setStorePersistenceReady(false)
      setStoreSyncState('error')
      setStoreLastLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load token store data from Supabase.',
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadStoreData() {
      if (!active) return
      await refreshStoreData()
    }

    loadStoreData()

    return () => {
      active = false
    }
  }, [refreshStoreData])

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
        const [actions, vipRules, sales, setupBundle, schedule, accounts] = await Promise.all([
          listTeachingActions(),
          getVIPRules(),
          listStoreSales(),
          loadSetupAssignmentsBundle(),
          loadTherapySchedule(),
          loadStaffAccounts(),
        ])

        const assignments = setupBundle?.assignments || {}
        const catalog = setupBundle?.academicCatalog || null

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
          if (catalog?.subjects?.length) {
            setAcademicCatalog(catalog)
          }
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
  const [setupAssignmentError, setSetupAssignmentError] = useState<string | null>(null)
  const [setupPerson, setSetupPerson] = useState('Rabbi Klein')
  const [setupAssignments, setSetupAssignments] = useState<Record<string, { periods: Record<number, Array<number | string>>; caseload: Array<number | string> }>>(() => {
    const assignments: Record<string, { periods: Record<number, Array<number | string>>; caseload: Array<number | string> }> = {}

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
      const classId = getLookupValue(STUDENT_CLASSES, student.id)
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

  const emptyAssignment = useMemo(() => ({
    periods: { 1: [], 2: [], 3: [] },
    caseload: [],
  }), [])

  const currentPerson = useMemo(() => {
    return SETUP_PEOPLE.find(person => person.name === setupPerson) || null
  }, [SETUP_PEOPLE, setupPerson])

  const visiblePeople = useMemo(() => {
    const search = setupPersonSearch.trim().toLowerCase()
    if (!search) return SETUP_PEOPLE

    return SETUP_PEOPLE.filter(person => {
      const haystack = `${person.name} ${person.specialty || ''}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [SETUP_PEOPLE, setupPersonSearch])

  const filteredSetupStudents = useMemo(() => {
    const search = setupStudentSearch.trim().toLowerCase()
    if (!search) return students || []

    return (students || []).filter(student => {
      const haystack = `${student.name || ''} ${student.className || ''} ${student.id || ''}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [students, setupStudentSearch])

  const currentAssignment = useMemo(() => {
    if (!currentPerson?.name) return emptyAssignment
    return setupAssignments[currentPerson.name] || emptyAssignment
  }, [currentPerson, setupAssignments, emptyAssignment])

  const overlapWarnings = useMemo(() => {
    const warnings: Array<{ period: number; studentName: string; teacherNames: string[] }> = []

    ;[1, 2, 3].forEach(period => {
      const ownerMap = new Map<string, string[]>()

      Object.entries(setupAssignments).forEach(([ownerName, assignment]) => {
        const studentIds = assignment?.periods?.[period] || []
        if (!studentIds.length) return

        studentIds.forEach(studentId => {
          const existing = ownerMap.get(String(studentId)) || []
          ownerMap.set(String(studentId), [...existing, ownerName])
        })
      })

      ownerMap.forEach((teacherNames, studentId) => {
        if (teacherNames.length < 2) return

        const student = students.find(item => String(item.id) === String(studentId))
        warnings.push({
          period,
          studentName: student?.name || `Student ${studentId}`,
          teacherNames: teacherNames.filter((name, index) => teacherNames.indexOf(name) === index),
        })
      })
    })

    return warnings
  }, [setupAssignments, students])

  const togglePeriodStudent = useCallback(async (period: number, studentId: number | string) => {
    if (!setupPerson) return

    setSetupAssignments(prev => {
      const prevAssignment = prev?.[setupPerson] || emptyAssignment
      const existingPeriodIds = prevAssignment.periods?.[period] || []
      const nextPeriodIds = existingPeriodIds.includes(studentId)
        ? existingPeriodIds.filter(id => id !== studentId)
        : [...existingPeriodIds, studentId]

      const nextAssignment = {
        ...prevAssignment,
        periods: {
          ...(prevAssignment.periods || { 1: [], 2: [], 3: [] }),
          [period]: nextPeriodIds,
        },
      }

      return {
        ...prev,
        [setupPerson]: nextAssignment,
      }
    })
  }, [emptyAssignment, setupPerson])

  const toggleCaseloadStudent = useCallback(async (studentId: number | string) => {
    if (!setupPerson) return

    setSetupAssignments(prev => {
      const prevAssignment = prev?.[setupPerson] || emptyAssignment
      const existingCaseload = prevAssignment.caseload || []
      const nextCaseload = existingCaseload.includes(studentId)
        ? existingCaseload.filter(id => id !== studentId)
        : [...existingCaseload, studentId]

      const nextAssignment = {
        ...prevAssignment,
        caseload: nextCaseload,
      }

      return {
        ...prev,
        [setupPerson]: nextAssignment,
      }
    })
  }, [emptyAssignment, setupPerson])

  const copyPeriodOneToTwo = useCallback(() => {
    if (!setupPerson) return

    setSetupAssignments(prev => {
      const prevAssignment = prev?.[setupPerson] || emptyAssignment
      const periodOne = prevAssignment.periods?.[1] || []
      const nextAssignment = {
        ...prevAssignment,
        periods: {
          ...(prevAssignment.periods || { 1: [], 2: [], 3: [] }),
          2: [...periodOne],
        },
      }

      return {
        ...prev,
        [setupPerson]: nextAssignment,
      }
    })
  }, [emptyAssignment, setupPerson])

  const [setupCustomActions, setSetupCustomActions] = useState<TeachingAction[]>([])
  const [setupCustomActionsLoaded, setSetupCustomActionsLoaded] = useState(false)

  function buildDefaultAcademicCatalog(): AcademicCatalogConfig {
    const subjectByLabel = new Map<string, {
      id: string
      label: string
      active: boolean
      divisionKeys: string[]
      classIds: string[]
      teacherNames: string[]
      skills: Array<{ id: string; label: string; active: boolean }>
    }>()

    Object.entries(ACADEMIC_AREAS || {}).forEach(([teacherName, teacherSubjects]) => {
      Object.entries(teacherSubjects || {}).forEach(([subjectLabel, skills]) => {
        const normalizedSubject = String(subjectLabel || '').trim()
        if (!normalizedSubject) return

        const existing = subjectByLabel.get(normalizedSubject)
        const skillValues = Array.isArray(skills) ? skills : []

        if (!existing) {
          subjectByLabel.set(normalizedSubject, {
            id: `subject-${normalizedSubject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            label: normalizedSubject,
            active: true,
            divisionKeys: [],
            classIds: [],
            teacherNames: [teacherName],
            skills: skillValues
              .filter(skill => String(skill || '').trim().length > 0)
              .map(skill => ({
                id: `skill-${String(skill).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                label: String(skill),
                active: true,
              })),
          })
          return
        }

        if (!existing.teacherNames.includes(teacherName)) {
          existing.teacherNames.push(teacherName)
        }

        skillValues.forEach(skill => {
          const label = String(skill || '').trim()
          if (!label) return
          if (existing.skills.some(item => item.label === label)) return
          existing.skills.push({
            id: `skill-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            label,
            active: true,
          })
        })
      })
    })

    return { subjects: Array.from(subjectByLabel.values()) }
  }

  const [academicCatalog, setAcademicCatalog] = useState<AcademicCatalogConfig>(() => buildDefaultAcademicCatalog())

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

  const [setupSales, setSetupSales] = useState<StoreSale[]>([])
  const [setupSalesLoaded, setSetupSalesLoaded] = useState(false)

  const [setupSaleDraft, setSetupSaleDraft] = useState({
    name: '',
    type: 'points-off',
    value: 5
  })

  const [setupAccounts, setSetupAccounts] = useState<Record<string, Record<string, unknown>>>({})

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

  useEffect(() => {
    if (!academicCatalog?.subjects?.length) return

    if (skipInitialAcademicCatalogSaveRef.current) {
      skipInitialAcademicCatalogSaveRef.current = false
      return
    }

    saveAcademicCatalog(academicCatalog).catch(error => {
      console.error('Unable to persist academic catalog:', error)
    })
  }, [academicCatalog])

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

  const [setupTherapySchedule, setSetupTherapySchedule] = useState<Array<Record<string, unknown>>>(
    createFakeTherapySchedule
  )
  const [setupTherapyView, setSetupTherapyView] = useState('therapist')
  const [setupTherapyFilters, setSetupTherapyFilters] = useState<Array<{ id: number | string; field: string; value: string }>>([])

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

  const updateSetupTherapyFilter = (id: number | string, changes: Partial<{ field: string; value: string }>) => {
    setSetupTherapyFilters(previous =>
      previous.map(filter =>
        filter.id === id
          ? { ...filter, ...changes }
          : filter
      )
    )
  }

  const removeSetupTherapyFilter = (id: number | string) => {
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
  const [todos, setTodos] = useState<Todo[]>([])
  const [todosLoaded, setTodosLoaded] = useState(false)
  const [todoLoadError, setTodoLoadError] = useState<string | null>(null)
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

  async function handleLogin(
    r: string,
    name: string,
    options: { restoreNavigation?: boolean } = {},
  ) {
    const staff = await getStaffByName(name)
    if (staff && staff.active === false) {
      console.warn(`Blocked login for inactive staff member ${name}.`)
      clearStoredAuthUser()
      setLoggedIn(false)
      setUserName('')
      setRole('admin')
      return
    }

    const access = getUserAccess(name, r)
  shouldRestoreNavRef.current = options.restoreNavigation === true
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
    if (staff?.active === false) {
      console.warn(`Blocked session creation for inactive staff member ${staff?.name || 'Unknown'}.`)
      return
    }

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

    try {
      const result = await applyPointsEventTx({
        studentId: Number(originalStudent.id),
        studentName: originalStudent.name,
        staffId: null,
        staffName: userName || 'Staff',
        staffRole: role || 'staff',
        pointsDelta: Number(pointsDelta || 0),
        reminderDelta: Number(reminderDelta || 0),
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

      setStudents(prev => prev.map(student =>
        Number(student.id) !== Number(studentId)
          ? student
          : {
              ...student,
              points: Number(result.nextPoints || 0),
              token_balance: Number(result.nextPoints || 0),
              reminders: Number(result.nextReminders || 0),
              behaviorLog: nextBehaviorLog,
            }
      ))

      return true
    } catch (error) {
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
    const optimisticNextPoints = Math.max(
      0,
      Number(currentStudent.points || 0) + reversalPointsDelta
    )
    const optimisticNextReminders = Math.max(
      0,
      Number(currentStudent.reminders || 0) + reversalReminderDelta
    )

    setStudents(prev => prev.map(student =>
      Number(student.id) !== Number(currentStudent.id)
        ? student
        : {
            ...student,
            points: optimisticNextPoints,
            token_balance: optimisticNextPoints,
            reminders: optimisticNextReminders,
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

    try {
      if (event.event_type === 'purchase' || event.category === 'store') {
        const reversal = await reverseStorePurchaseTx({
          targetPointsEventId: Number(event.id),
          staffName: userName || 'Staff',
          staffRole: role || 'staff',
          note: `Reversed store purchase event #${event.id}`,
          sourceContext: 'history-undo',
        })

        setStudents(prev => prev.map(student =>
          Number(student.id) !== Number(currentStudent.id)
            ? student
            : {
                ...student,
                points: Number(reversal.nextPoints || 0),
                token_balance: Number(reversal.nextPoints || 0),
                reminders: optimisticNextReminders,
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

        setStoreItems(prev => prev.map(item => (
          Number(item.id) === Number(reversal.itemId)
            ? { ...item, stock: Number(reversal.nextStock || item.stock || 0) }
            : item
        )))
      } else {
        const reversal = await reversePointsEventTx({
          targetEventId: Number(event.id),
          staffName: userName || 'Staff',
          staffRole: role || 'staff',
          note: `Reversed event #${event.id}`,
          sourceContext: 'history-undo',
        })

        setStudents(prev => prev.map(student =>
          Number(student.id) !== Number(currentStudent.id)
            ? student
            : {
                ...student,
                points: Number(reversal.nextPoints || 0),
                token_balance: Number(reversal.nextPoints || 0),
                reminders: Number(reversal.nextReminders || 0),
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
      }

      try {
        const refreshedEvents = await listPointsEventsForStudent(Number(currentStudent.id))
        setSelectedStudentPointsEvents(refreshedEvents)
      } catch (refreshError) {
        console.error('Unable to refresh points history after undo:', refreshError)
      }

      return true
    } catch (error) {
      console.error('Undo points event failed:', error)

      setStudents(prev => prev.map(student =>
        Number(student.id) !== Number(currentStudent.id)
          ? student
          : {
              ...student,
              points: Number(currentStudent.points || 0),
              token_balance: Number(currentStudent.token_balance || 0),
              reminders: Number(currentStudent.reminders || 0),
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
  function generateStorePurchaseAttemptKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  function isRetryablePurchaseError(error: unknown) {
    const message = String((error as Error)?.message || '').toLowerCase()
    return message.includes('failed to fetch') || message.includes('network') || message.includes('fetch')
  }

  async function buyItem(studentId: number | string, item: StoreItemLike) {
    const s = students.find(x => x.id === studentId)
    if (!s || (s.points ?? 0) < (item.cost ?? 0)) { alert('Not enough points!'); return }
    if ((item.stock ?? 0) <= 0) { alert(`${item.name} is out of stock.`); return }
    if (isStoreItemRestrictedForStudent(s, item)) { alert(`${s.name} cannot redeem candy items.`); return }
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    playSound('store')
    const attemptSlot = `${Number(studentId)}:${Number(item.id)}`
    let attemptKey = storePurchaseAttemptKeysRef.current[attemptSlot]

    if (!attemptKey) {
      attemptKey = generateStorePurchaseAttemptKey()
      storePurchaseAttemptKeysRef.current[attemptSlot] = attemptKey
    }

    try {
      setStoreSyncState('pending-sync')

      let purchaseResult
      try {
        purchaseResult = await redeemStorePurchaseTx({
          studentId: Number(s.id),
          itemId: Number(item.id),
          staffName: userName || 'Register',
          staffRole: role || 'staff',
          idempotencyKey: attemptKey,
          source: 'token-store',
          reason: `Store purchase: ${item.name}`,
          note: `${s.name} redeemed ${item.name}`,
          sourcePage: 'store',
          sourceContext: 'token-store-redeem',
          metadata: {
            division: studentDivision(s),
            staffRole: role || 'staff',
            itemId: Number(item.id),
            itemName: item.name,
            itemCost: Number(item.cost || 0),
          },
        })
      } catch (error) {
        if (!isRetryablePurchaseError(error)) {
          throw error
        }

        purchaseResult = await redeemStorePurchaseTx({
          studentId: Number(s.id),
          itemId: Number(item.id),
          staffName: userName || 'Register',
          staffRole: role || 'staff',
          idempotencyKey: attemptKey,
          source: 'token-store',
          reason: `Store purchase: ${item.name}`,
          note: `${s.name} redeemed ${item.name}`,
          sourcePage: 'store',
          sourceContext: 'token-store-redeem',
          metadata: {
            division: studentDivision(s),
            staffRole: role || 'staff',
            itemId: Number(item.id),
            itemName: item.name,
            itemCost: Number(item.cost || 0),
          },
        })
      }

      setStudents(prev => prev.map(student =>
        Number(student.id) !== Number(s.id)
          ? student
          : {
              ...student,
              points: Number(purchaseResult.nextPoints || 0),
              token_balance: Number(purchaseResult.nextPoints || 0),
              behaviorLog: [
                {
                  label: `Store purchase: ${item.name}`,
                  points: -Number(item.cost || 0),
                  date: new Date().toISOString().slice(0, 10),
                },
                ...(student.behaviorLog || []),
              ].slice(0, 30),
            }
      ))

      setStoreItems(prev => prev.map(entry => (
        Number(entry.id) === Number(purchaseResult.itemId)
          ? { ...entry, stock: Number(purchaseResult.nextStock || entry.stock || 0) }
          : entry
      )))

      setStoreSyncState('ready')
      delete storePurchaseAttemptKeysRef.current[attemptSlot]

      setPurchaseLog(prev => [{
        id: Number(purchaseResult.redemptionId),
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        studentId: Number(s.id),
        studentName: s.name,
        itemName: String(item.name || ''),
        cost: Number(item.cost || 0),
        staff: userName || 'Register',
        division: String(studentDivision(s) || ''),
      }, ...prev].slice(0, 25))

      alert(`${s.name} redeemed: ${item.name}!`)
    } catch (error) {
      setStoreSyncState('error')
      console.error('Store redemption failed:', error)

      if (!isRetryablePurchaseError(error)) {
        delete storePurchaseAttemptKeysRef.current[attemptSlot]
      }

      alert(formatSupabaseError(error))
    }
  }

  function updateStoreItem(id: number | string, field: string, value: unknown) {
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    let previousItem: StoreItemLike | null = null
    let nextItem: StoreItemLike | null = null

    setStoreSyncState('pending-sync')

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

    if (!nextItem) {
      setStoreSyncState('ready')
      return
    }

    const normalizedItem = normalizeStoreItemInput(nextItem)
    const persistedItem = {
      ...nextItem,
      ...normalizedItem,
      id: Number(nextItem.id),
      cost: normalizedItem.cost,
      stock: normalizedItem.stock,
      lowStockAt: normalizedItem.lowStockAt,
      emoji: normalizedItem.emoji,
      vip: normalizedItem.vip,
      category: normalizedItem.category,
      name: normalizedItem.name,
    }

    saveStoreItem(persistedItem as typeof nextItem, userName || 'Store Manager')
      .then(savedItem => {
        setStoreSyncState('ready')
        setStoreItems(prev => prev.map(item => (
          Number(item.id) === Number(savedItem.id)
            ? { ...item, ...savedItem }
            : item
        )))
      })
      .catch(error => {
        setStoreSyncState('error')
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

  function adjustStoreStock(id: number | string, amount: number | string) {
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    setStoreSyncState('pending-sync')

    adjustStoreItemStockBy(Number(id), Number(amount || 0), userName || 'Store Manager')
      .then(savedItem => {
        setStoreSyncState('ready')
        setStoreItems(prev => prev.map(item => (
          Number(item.id) === Number(savedItem.id)
            ? { ...item, ...savedItem }
            : item
        )))
      })
      .catch(error => {
        setStoreSyncState('error')
        console.error('Unable to adjust stock:', error)
        alert(
          error instanceof Error
            ? error.message
            : 'Unable to adjust store stock.',
        )
      })
  }

  async function addStoreItem() {
    if (!String(newStoreItem.name).trim()) { alert('Add an item name first.'); return }
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    try {
      setStoreSyncState('pending-sync')

      const createPayload = normalizeStoreItemInput({
        name: newStoreItem.name,
        category: newStoreItem.category,
        cost: newStoreItem.cost,
        emoji: newStoreItem.emoji,
        vip: newStoreItem.vip,
        stock: newStoreItem.stock,
        lowStockAt: newStoreItem.lowStockAt,
      })

      const item = await createStoreItem(createPayload, userName || 'Store Manager')

      setStoreSyncState('ready')
      setStoreItems(prev => [...prev, item])
      setNewStoreItem({ name: '', cost: '', stock: '', lowStockAt: '5', emoji: '', category: 'nosh', vip: false })
    } catch (error) {
      setStoreSyncState('error')
      console.error('Unable to add store item in Supabase:', {
        error,
        formattedError: formatSupabaseError(error),
        attemptedPayload: normalizeStoreItemInput({
          name: newStoreItem.name,
          category: newStoreItem.category,
          cost: newStoreItem.cost,
          emoji: newStoreItem.emoji,
          vip: newStoreItem.vip,
          stock: newStoreItem.stock,
          lowStockAt: newStoreItem.lowStockAt,
        }),
        attemptedBy: userName || 'Store Manager',
      })
      alert(`Unable to add store item. ${formatSupabaseError(error)}`)
    }
  }

  async function removeStoreItem(id: number | string) {
    if (!confirm('Remove this store item from the demo?')) return
    if (!storePersistenceReady) {
      alert('Token Store is not synced to Supabase yet.')
      return
    }

    try {
      setStoreSyncState('pending-sync')

      await setStoreItemActive(Number(id), false, userName || 'Store Manager')
      setStoreSyncState('ready')
      setStoreItems(prev => prev.filter(item => Number(item.id) !== Number(id)))
    } catch (error) {
      setStoreSyncState('error')
      console.error('Unable to remove store item:', error)
      alert('Unable to remove store item.')
    }
  }

  function updateUnknownLocation(studentId: number | string, newStatus: string, label: string) {
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
    
    const nextStatus = newStatus === 'absent'
      ? 'not-arrived'
      : newStatus === 'left-early'
        ? 'left-early'
        : newStatus
    const unknownSince = nextStatus === 'unknown'
      ? (studentBeforeUpdate?.unknownSince || new Date().toISOString())
      : null

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      return {
        ...s,
        status: nextStatus,
        unknownSince,
        dailyStatus: newStatus === 'absent' ? 'absent' : newStatus === 'left-early' ? 'left-early' : s.dailyStatus,
        classLog: updatedClassLog
      }
    }))
    
    persistStudentFields(studentId, {
      status: nextStatus,
      unknownSince,
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

  const contextInfo = useMemo(() => getDashboardContextInfo(page, role, divisionView), [page, role, divisionView])
  const realtimeScopeLabel = realtimeNotice?.scope === 'store'
    ? 'Token Store'
    : realtimeNotice?.scope === 'flags'
      ? 'Flags'
      : realtimeNotice?.scope === 'points'
        ? 'Points'
        : 'Shared records'

  const roleNavConfig = getRoleNavConfig(role)

  const topAreas = roleNavConfig.topAreas
  const submenuByArea = roleNavConfig.submenuByArea
  const useTwoLevelNav = true
  const activeTopArea = topAreas.find(area => area.pages.includes(page))?.id || topAreas[0]?.id || 'dashboard'
  const submenuItems = submenuByArea[activeTopArea] || []
  const pageLabelById = Object.values(submenuByArea)
    .flat()
    .reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.label
      return acc
    }, {})

  const schoolDayArea = topAreas.find(area => area.id === 'school-day') || null
  const defaultSchoolDayPage = schoolDayArea?.defaultPage || 'attendance'

  function navigateToPage(nextPage: string) {
    if (nextPage !== 'teaching-mode') {
      setTeachingMode(false)
    }
    setPage(nextPage)
  }

  function openTeachingMode() {
    if (schoolDayArea?.pages.includes(page) && page !== 'teaching-mode') {
      lastSchoolDayPageRef.current = page
    } else if (!lastSchoolDayPageRef.current) {
      lastSchoolDayPageRef.current = defaultSchoolDayPage
    }

    setPage('teaching-mode')
    setTeachingMode(true)
  }

  function closeTeachingModeToSchoolDay() {
    const fallbackPage = schoolDayArea?.pages.includes(lastSchoolDayPageRef.current)
      ? lastSchoolDayPageRef.current
      : defaultSchoolDayPage

    setTeachingMode(false)
    setPage(fallbackPage)
  }

  useEffect(() => {
    if (!loggedIn) {
      navRestoreAppliedRef.current = false
      shouldRestoreNavRef.current = false
      return
    }

    if (navRestoreAppliedRef.current) return

    if (shouldRestoreNavRef.current) {
      const stored = readDashboardNavState()
      const allowedPages = new Set(topAreas.flatMap(area => area.pages))

      if (stored.currentPage && allowedPages.has(stored.currentPage)) {
        setPage(stored.currentPage)
      } else if (stored.majorSection) {
        const section = topAreas.find(area => area.id === stored.majorSection)
        if (section) {
          setPage(section.defaultPage)
        }
      }

      if (stored.divisionView) {
        const access = getUserAccess(userName, role)
        const validDivisionValues = new Set(
          access.divisions.length > 1 ? ['all', ...access.divisions] : access.divisions,
        )
        if (validDivisionValues.has(stored.divisionView)) {
          setDivisionView(stored.divisionView)
        }
      }
    }

    navRestoreAppliedRef.current = true
  }, [loggedIn, role, userName, topAreas])

  useEffect(() => {
    if (!loggedIn) return

    try {
      localStorage.setItem(
        DASHBOARD_NAV_STATE_STORAGE_KEY,
        JSON.stringify({
          majorSection: activeTopArea,
          currentPage: page,
          divisionView,
        }),
      )
    } catch (error) {
      console.error('Failed to persist dashboard nav state:', error)
    }
  }, [loggedIn, activeTopArea, page, divisionView])

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_PROFILE_TAB_STORAGE_KEY, selectedStudentTab)
    } catch (error) {
      console.error('Failed to persist student profile tab:', error)
    }
  }, [selectedStudentTab])

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
          : (teacherClass || getLookupValue(TEACHER_CLASS_MAP, userName))
            ? [teacherClass || getLookupValue(TEACHER_CLASS_MAP, userName)]
            : []
      )
    : []
  const assignedTeacherStudentIdsForMode = isTeacherRoleForMode
    ? getTeacherAssignedStudentIds(userName, setupAssignments)
    : []
  const assignedStaffStudentIdsForMode = getTeacherAssignedStudentIds(userName, setupAssignments)
  const assignedStaffStudentSetForMode = new Set(assignedStaffStudentIdsForMode)
  const isLeadershipRoleForMode = role === 'admin'
  const assignedTeacherStudentSetForMode = new Set(assignedTeacherStudentIdsForMode)
  const studentsForCurrentRole = isTeacherRoleForMode
    ? (
        assignedTeacherStudentSetForMode.size > 0
          ? students.filter(s => assignedTeacherStudentSetForMode.has(Number(s.id)))
          : divisionScopedStudentsForMode.filter(
              s => assignedTeacherClassIdsForMode.includes(resolveStudentClassId(s))
            )
      )
    : isLeadershipRoleForMode
      ? students
      : (
          assignedStaffStudentSetForMode.size > 0
            ? divisionScopedStudentsForMode.filter(s => assignedStaffStudentSetForMode.has(Number(s.id)))
            : divisionScopedStudentsForMode
        )
  
  if (teachingMode) return (
    <TeachingMode
      students={studentsForCurrentRole}
      allStudents={students}
      setStudents={setStudents}
      onExit={closeTeachingModeToSchoolDay}
      isAdmin={role === 'admin'}
      role={role}
      userName={userName}
      initialClass={assignedTeacherClassIdsForMode[0] || null}
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
      canViewEntireSchool={role === 'admin'}
      assignedStudentIds={assignedStaffStudentIdsForMode}
      assignmentPeriods={setupAssignments?.[userName]?.periods || {}}
      teachingAssignments={setupAssignments}
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
          : (teacherClass || getLookupValue(TEACHER_CLASS_MAP, userName))
            ? [teacherClass || getLookupValue(TEACHER_CLASS_MAP, userName)]
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
  const present = visibleStudents.filter(s => isInSchool(s)).length
  const absent = visibleStudents.filter(s => getDailyAttendanceStatus(s) === 'absent').length
  const late = visibleStudents.filter(s => getDailyAttendanceStatus(s) === 'late').length
  const inTherapy = visibleStudents.filter(s => s.status === 'therapy').length
  const withBT = visibleStudents.filter(s => s.status === 'with-bt').length
  const unknown = visibleStudents.filter(s => s.status === 'unknown').length
  const notArrived = visibleStudents.filter(s => s.status === 'not-arrived').length
  const total = visibleStudents.length
  const cameTodayStudents = visibleStudents.filter(s => cameToSchoolToday(s))
  const cameToday = cameTodayStudents.length
  const stillInYeshivaStudents = visibleStudents.filter(s => isInSchool(s))
  const stillInYeshiva = stillInYeshivaStudents.length
  const inClassroomsStudents = visibleStudents.filter(s => isInClassroom(s))
  const inClassrooms = inClassroomsStudents.length
  const lateStudents = visibleStudents.filter(s => getDailyAttendanceStatus(s) === 'late')
  const leftEarlyStudents = visibleStudents.filter(s => getDailyAttendanceStatus(s) === 'left-early')
  const absentTodayStudents = visibleStudents.filter(s => getDailyAttendanceStatus(s) === 'absent')
  const cameTodayRate = total ? Math.round(cameToday / total * 100) : 0
  const improved = visibleStudents.filter(s => (s.reminders ?? 0) < (s.lastWeekReminders ?? 0)).length
  const needsAttention = visibleStudents.filter(s => (s.reminders ?? 0) > (s.lastWeekReminders ?? 0)).length
  const vipStudents = visibleStudents.filter(s => checkIsVIP(s))
  const urgentStudents = visibleStudents.filter(s => (s.reminders ?? 0) >= 6 || Boolean(s.detention) || (s.att ?? []).filter(d => d === 'A').length >= 3 || s.status === 'unknown')
  const callsDueStudents = visibleStudents.filter(s => { const parentCalls = Array.isArray(s.parentCalls) ? s.parentCalls : []; const lc = parentCalls.length > 0 ? parentCalls[parentCalls.length - 1] as { date?: string } | undefined : null; return !lc?.date || daysSince(lc.date) > 14 })
  const divisionSummaries = userAccess.divisions.map(key => {
    const list = students.filter(s => studentDivision(s) === key)
    return {
      key,
      label: divisionLabel(key),
      students: list,
      inBuilding: list.filter(s => isInSchool(s)).length,
      unknown: list.filter(s => s.status === 'unknown').length,
      absent: list.filter(s => getDailyAttendanceStatus(s) === 'absent').length,
      late: list.filter(s => getDailyAttendanceStatus(s) === 'late').length,
    }
  })

  const alerts = visibleStudents.flatMap(s => {
    const a: Array<{ student?: string; id?: number | string; msg: string; type: 'danger' | 'warn' | 'info' }> = []
    const attendance = Array.isArray(s.att) ? s.att : []
    const absCount = attendance.filter(d => d === 'A').length
    const lateCount = attendance.filter(d => d === 'L').length
    const parentCalls = Array.isArray(s.parentCalls) ? s.parentCalls : []
    const lastCall = parentCalls.length > 0 ? parentCalls[parentCalls.length - 1] as { date?: string } | undefined : null
    if (s.status === 'unknown') a.push({ student: s.name, id: s.id, msg: '❓ Location unknown — please locate immediately!', type: 'danger' })
    if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
    if ((s.reminders ?? 0) >= 6) a.push({ student: s.name, id: s.id, msg: '6 reminders — consequence required!', type: 'danger' })
    if ((s.reminders ?? 0) >= 4 && (s.reminders ?? 0) < 6) a.push({ student: s.name, id: s.id, msg: `${s.reminders ?? 0} reminders this week`, type: 'warn' })
    if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: `Absent ${absCount} days this week`, type: absCount >= 3 ? 'danger' : 'warn' })
    if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: `Late ${lateCount} days`, type: 'warn' })
    if (!lastCall?.date || daysSince(lastCall.date) > 14) a.push({ student: s.name, id: s.id, msg: lastCall?.date ? `No parent call in ${daysSince(lastCall.date)} days` : 'Parent never called', type: 'info' })
    return a
  }).sort((a, b) => {
    const order = { danger: 0, warn: 1, info: 2 }
    return order[a.type] - order[b.type]
  })

  const isSetupCenterPage = page === 'setup' && role === 'admin'
  const showGlobalTopControls = studentFallbackPatchCount > 0 || (role === 'admin' && !showStaffPanel)
  const mainStyle = { ...S.main, background: '#f3f4f6' }
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

  const normalizedSearch = String(search || '').trim().toLowerCase()
  const searchedStudents = normalizedSearch
    ? visibleStudents.filter(s => String(s.name || '').trim().toLowerCase().includes(normalizedSearch))
    : visibleStudents
  const filteredStudents = attFilter === 'all' ? searchedStudents : searchedStudents.filter(s => s.status === attFilter)
  const reportsOverview = buildReportsOverview({
    attendanceRows: buildAttendanceReportRows(filteredStudents),
    intakeList,
  })
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

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
      <style>{`
        @keyframes dashboardPageFade {
          0% { opacity: 0.78; }
          100% { opacity: 1; }
        }
      `}</style>
      {useTwoLevelNav && (
      <div style={{ width: 216, background: '#f8fafc', borderRight: '1px solid #dbe5f0', padding: '14px 10px', boxSizing: 'border-box' }}>
        <div style={{ padding: '8px 8px 10px', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f2942' }}>Hadran Academy</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {role === 'admin' && isOfficeUser
              ? 'Office Portal'
              : role === 'admin'
                ? 'Principal Portal'
                : role === 'teacher' || role === 'rebbe'
                  ? 'Teacher Portal'
                  : role === 'store'
                    ? 'Canteen Register'
                    : 'Therapist Portal'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 3 }}>
          {submenuItems.map(item => {
            const isActive = page === item.id || (item.id === 'teaching-mode' && teachingMode)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'teaching-mode') {
                    openTeachingMode()
                    return
                  }
                  navigateToPage(item.id)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #5f83aa' : '3px solid transparent',
                  borderRadius: 6,
                  background: isActive ? '#dbe8f5' : 'transparent',
                  color: isActive ? '#123251' : '#334155',
                  padding: '9px 10px',
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 8px 0', borderTop: '1px solid #dbe5f0', marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f2942', marginBottom: 2 }}>{userName || 'Signed in user'}</div>
          <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 8 }}>{buildLoginAccountRoleLabel(role)}</div>
          {role === 'admin' && (
            <button
              onClick={() => setShowLoginActivity(true)}
              style={{ width: '100%', textAlign: 'left', border: '1px solid #dbe5f0', background: '#ffffff', color: '#334155', borderRadius: 7, padding: '7px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}
            >
              Login Activity
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', border: '1px solid #dbe5f0', background: '#ffffff', color: '#334155', borderRadius: 7, padding: '7px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            Sign Out / Switch User
          </button>
        </div>
      </div>
      )}

      <div style={mainStyle}>
        <div key={page} data-page-transition={pageTransition} style={{ maxWidth: 1180, marginLeft: 'auto', marginRight: 'auto', animation: pageTransition === 'enter' ? 'dashboardPageFade 180ms ease-out both' : 'none' }}>
        {useTwoLevelNav && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {topAreas.map(area => {
              const isActive = activeTopArea === area.id
              return (
                <button
                  key={area.id}
                  onClick={() => navigateToPage(area.defaultPage)}
                  style={{
                    border: 'none',
                    background: isActive ? '#dbe8f5' : '#ffffff',
                    color: isActive ? '#123251' : '#334155',
                    borderRadius: 7,
                    padding: '7px 11px',
                    fontSize: 12,
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {area.label}
                </button>
              )
            })}
          </div>
        )}
        {useTwoLevelNav && (
          <div style={{ marginBottom: 14, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {(topAreas.find(area => area.id === activeTopArea)?.label || 'Dashboard')}
            {' > '}
            {(page === 'teaching-mode' && teachingMode) ? 'Teaching Mode' : (pageLabelById[page] || page)}
          </div>
        )}
        {(!isSetupCenterPage || showGlobalTopControls) && (
          <div style={{ marginBottom: isSetupCenterPage ? 8 : 14, display: 'flex', justifyContent: isSetupCenterPage ? 'flex-end' : 'space-between', alignItems: isSetupCenterPage ? 'center' : 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            {!isSetupCenterPage && (
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16243a', letterSpacing: '-0.02em' }}>{contextInfo.pageLabel}</div>
                <div style={{ fontSize: 12, color: '#51657d', marginTop: 4 }}>{greeting} · {todayLabel}</div>
                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999, background: '#e8f0f6', color: '#34516f', fontSize: 11, fontWeight: 700 }}>
                  {contextInfo.contextSummary}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {studentFallbackPatchCount > 0 && (
                <span style={{ padding: '6px 10px', borderRadius: 999, background: '#fef2f2', color: '#9f1239', fontSize: 12, fontWeight: 700, border: '1px solid #fecaca' }}>
                  Pending sync: {studentFallbackPatchCount}
                </span>
              )}
              {role === 'admin' && !showStaffPanel && (
                <button
                  onClick={() => setShowStaffPanel(true)}
                  style={{
                    border: '1px solid #2f5f8f',
                    background: '#3f6f9f',
                    color: '#ffffff',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Show Logged In Staff panel"
                >
                  Logged In Staff
                </button>
              )}
            </div>
          </div>
        )}
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
        {!isSetupCenterPage && (
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {divisionOptions.map(option => (
                <button key={option} onClick={() => setDivisionView(option)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${divisionView === option ? '#5f83aa' : '#d8e1ec'}`, background: divisionView === option ? '#dbe8f5' : '#ffffff', color: divisionView === option ? '#112f4d' : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: 'none' }}>
                  {divisionLabel(option)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {realtimeNotice && (
                <div style={{
                  border: '1px solid #dbe7f4',
                  background: '#f8fbff',
                  color: '#4f6687',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 9px',
                  whiteSpace: 'nowrap',
                }}>
                  Updated just now • {realtimeScopeLabel}
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." spellCheck lang="en" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #dde6f0', fontSize: 13, width: 'min(100%, 280px)', background: '#fcfdff', boxShadow: '0 6px 18px rgba(30,41,59,0.04)', outline: 'none' }} />
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
          </div>
        )}

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
          <AdminOfficeDashboardPage
            S={S}
            getGreeting={getGreeting}
            userName={userName}
            LiveClock={LiveClock}
            setPage={setPage}
            setIntakeSection={setIntakeSection}
            storeItems={storeItems}
            openStudent={openStudent}
            intakeList={intakeList}
            preIntakeList={preIntakeList}
            callsDueStudents={callsDueStudents}
            alerts={alerts}
            students={students}
            setDrillDown={setDrillDown}
            setShowUnknownPopup={setShowUnknownPopup}
            divisionLabel={divisionLabel}
            divisionView={divisionView}
            divisionSummaries={divisionSummaries}
            DIVISIONS={DIVISIONS}
            inClassrooms={inClassrooms}
            inClassroomsStudents={inClassroomsStudents}
            late={late}
            lateStudents={lateStudents}
            inTherapy={inTherapy}
            withBT={withBT}
            leftEarlyStudents={leftEarlyStudents}
            absentTodayStudents={absentTodayStudents}
            cameTodayRate={cameTodayRate}
            cameToday={cameToday}
            stillInYeshiva={stillInYeshiva}
            unknown={unknown}
            urgentStudents={urgentStudents}
            userAccess={userAccess}
          />
        )}


        {page === 'setup' && role === 'admin' && (
          <SetupCenterPage
            S={S}
            role={role}
            userName={userName}
            setupTab={setupTab}
            setSetupTab={setSetupTab}
            setupAssignmentError={setupAssignmentError}
            setSetupAssignmentError={setSetupAssignmentError}
            setupPersonSearch={setupPersonSearch}
            setSetupPersonSearch={setSetupPersonSearch}
            setupStudentSearch={setupStudentSearch}
            setSetupStudentSearch={setSetupStudentSearch}
            setupAssignments={setupAssignments}
            setSetupAssignments={setSetupAssignments}
            setupPerson={setupPerson}
            setSetupPerson={setSetupPerson}
            emptyAssignment={emptyAssignment}
            currentPerson={currentPerson}
            visiblePeople={visiblePeople}
            filteredSetupStudents={filteredSetupStudents}
            togglePeriodStudent={togglePeriodStudent}
            toggleCaseloadStudent={toggleCaseloadStudent}
            copyPeriodOneToTwo={copyPeriodOneToTwo}
            overlapWarnings={overlapWarnings}
            setupActionDraft={setupActionDraft}
            setSetupActionDraft={setSetupActionDraft}
            setSetupCustomActions={setSetupCustomActions}
            setupCustomActions={setupCustomActions}
            academicCatalog={academicCatalog}
            setAcademicCatalog={setAcademicCatalog}
            setupVipRules={setupVipRules}
            setSetupVipRules={setSetupVipRules}
            setupSaleDraft={setupSaleDraft}
            setSetupSaleDraft={setSetupSaleDraft}
            setSetupSales={setSetupSales}
            setupSales={setupSales}
            setupAccounts={setupAccounts}
            setSetupAccounts={setSetupAccounts}
            setupTherapySchedule={setupTherapySchedule}
            setSetupTherapySchedule={setSetupTherapySchedule}
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
            DIVISIONS={DIVISIONS}
            TEACHING_STAFF_OPTIONS={TEACHING_STAFF_OPTIONS}
            SUPPORT_STAFF_OPTIONS={SUPPORT_STAFF_OPTIONS}
            setupNavItems={setupNavItems}
            students={students}
            staffMembers={staffMembers}
            initials={initials}
            refreshStaffMembers={refreshStaffMembers}
            currentAssignment={currentAssignment}
            setPage={setPage}
            SETUP_PEOPLE={SETUP_PEOPLE}
          />
        )}

        {page === 'therapists' && role === 'admin' && (
          <TherapistAssignmentsPage
            S={S}
            students={students}
            setStudents={setStudents}
            THERAPIST_OPTIONS={THERAPIST_OPTIONS}
            SCHEDULE_PERIODS={SCHEDULE_PERIODS}
            persistStudentFields={persistStudentFields}
          />
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
            CLASS_DIVISION={CLASS_DIVISION}
            ACADEMIC_AREAS={ACADEMIC_AREAS}
            academicCatalog={academicCatalog}
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
            refreshStoreData={refreshStoreData}
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
          <IntakePage
            S={S}
            intakeSection={intakeSection}
            setIntakeSection={setIntakeSection}
            intakeList={intakeList}
            setIntakeList={setIntakeList}
            selectedIntake={selectedIntake}
            setSelectedIntake={setSelectedIntake}
            intakeTab={intakeTab}
            setIntakeTab={setIntakeTab}
            selectedPreIntake={selectedPreIntake}
            setSelectedPreIntake={setSelectedPreIntake}
            preIntakeList={preIntakeList}
            setPreIntakeList={setPreIntakeList}
            getAdmissionsReport={getAdmissionsReport}
            initials={initials}
            divisionView={divisionView}
            TOUR_STAFF_OPTIONS={TOUR_STAFF_OPTIONS}
            setPage={setPage}
          />
        )}
        {/* Intake UI moved to IntakePage component. */}


        {page === 'todo' && role === 'admin' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...S.card, padding: '16px 18px', border: '1px solid #dbe8f5', borderRadius: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#172033', marginBottom: 8 }}>Reports Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2942', marginTop: 4 }}>{reportsOverview.attendanceSummary.total}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Present {reportsOverview.attendanceSummary.present} · Absent {reportsOverview.attendanceSummary.absent}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admissions</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2942', marginTop: 4 }}>{reportsOverview.admissionsSummary.total}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Accepted {reportsOverview.admissionsSummary.accepted} · Needs info {reportsOverview.admissionsSummary.needsInfo}</div>
                </div>
              </div>
            </div>
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
          </div>
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
        onNavigateStudent={(student, tab) => {
          openStudent(student, tab)
          setSelectedStudent(student)
        }}
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
        HISTORICAL_DATA={HISTORICAL_DATA}
        TrackingTab={TrackingTabView}
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
              ...TEACHING_STAFF_OPTIONS,
              ...STAFF.map(member => member.name),
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


