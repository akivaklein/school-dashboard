import { useState, useEffect, type CSSProperties } from 'react'
import type { TeacherRebbeAssignment } from '../../services/setupCenterService'

export type StudentLike = {
  id: number | string
  name?: string
  status?: string | null
  dailyStatus?: string | null
  withStaff?: string | number | null
  className?: string
  classId?: string | number | null
  grade?: string | number | null
  studentClassAssignmentId?: string | null
  studentClassAssignmentDivisionKey?: string
  is_active?: boolean
  services?: Array<{ type?: string; [key: string]: unknown }>
  notes?: Array<Record<string, unknown>>
  behaviorLog?: Array<Record<string, unknown>>
  parentCalls?: Array<Record<string, unknown>>
  testScores?: Array<{ id?: string | number; [key: string]: unknown }>
  token_balance?: number
  att?: string[]
  lateDetails?: { timeArrived?: string; reason?: string; note?: string }
  departureDetails?: { timeDeparted?: string; reason?: string; note?: string }
  classLog?: Array<{ type: string; time: string; note?: string; staffId?: number | string }>
  points?: number
  reminders?: number
  lastWeekReminders?: number
  [key: string]: unknown
}

export type StoreItemLike = {
  id?: number | string
  name?: string
  emoji?: string
  cost?: number
  stock?: number
  [key: string]: unknown
}

export type AttendanceHistoryEntry = {
  date: string
  inMins: number
  outMins: number
  pct: number
  staffName?: string
  [key: string]: unknown
}

export type StaffMemberLike = {
  id?: number | string
  name?: string
  role?: string
  active?: boolean
  [key: string]: unknown
}

export type StudentFlagLike = {
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

export function daysSince(dateStr: string) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
export function initials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#334155','#475569','#3f4f63','#526070','#5f6c7a','#3f5f68','#5b5f7a','#606f64','#6f6254','#495867','#56616d','#4b6470','#6b6259','#576070','#425466','#6a5d68','#536157','#6a5848','#465a69','#64748b','#596475']

export function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

export function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, entryValue]) => {
    acc[key] = typeof entryValue === 'string' ? entryValue : String(entryValue ?? '')
    return acc
  }, {})
}

export function normalizeStaffName(name: string) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isTeacherAssignmentActive(assignment: TeacherRebbeAssignment, now = new Date()) {
  if (!assignment || assignment.status !== 'active') return false

  if (assignment.start_date) {
    const startDate = new Date(`${assignment.start_date}T00:00:00`)
    if (now < startDate) return false
  }

  if (assignment.end_date) {
    const endDate = new Date(`${assignment.end_date}T23:59:59`)
    if (now > endDate) return false
  }

  return true
}

export function extractPeriodNumber(periodLabel: string) {
  const match = String(periodLabel || '').match(/(\d+)/)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

export function buildTeacherPeriodBuckets(assignments: TeacherRebbeAssignment[]) {
  const result: Record<string, { periods: Record<number, number[]>; caseload: number[] }> = {}

  assignments.forEach(assignment => {
    if (!isTeacherAssignmentActive(assignment)) return
    const teacherName = normalizeStaffName(assignment.teacher_name)
    if (!teacherName) return

    if (!result[teacherName]) {
      result[teacherName] = {
        periods: { 1: [], 2: [], 3: [] },
        caseload: [],
      }
    }

    const studentId = Number(assignment.student_id)
    if (!Number.isFinite(studentId)) return

    result[teacherName].caseload.push(studentId)

    const periodNumber = extractPeriodNumber(assignment.period)
    if (periodNumber && [1, 2, 3].includes(periodNumber)) {
      result[teacherName].periods[periodNumber].push(studentId)
    }
  })

  Object.values(result).forEach(bucket => {
    bucket.caseload = Array.from(new Set(bucket.caseload))
    ;[1, 2, 3].forEach(period => {
      bucket.periods[period] = Array.from(new Set(bucket.periods[period]))
    })
  })

  return result
}

export function getImprovement(s: { lastWeekReminders: number; reminders: number }) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#56765f', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#56765f', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#9f1239', icon: '📉' }
  return { label: 'Same as last week', color: '#9a6a2a', icon: '➡️' }
}

export function isVIP(s: { att: string[]; points: number; reminders: number }, rules: { minimumPoints: number; maximumReminders: number; minimumAttendance: number; requireAll: boolean }) {
  const presentCount = s.att.filter((d: string) => d === 'P').length
  const attPct = s.att.length > 0 ? (presentCount / s.att.length) * 100 : 100
  const checks = [
    s.points >= rules.minimumPoints,
    s.reminders <= rules.maximumReminders,
    attPct >= rules.minimumAttendance,
  ]
  return rules.requireAll ? checks.every(Boolean) : checks.some(Boolean)
}

export function isStoreItemRestrictedForStudent(student: StudentLike | null | undefined, item: StoreItemLike | null | undefined) {
  if (!student || !item) return false
  const studentName = (student.name || '').toLowerCase()
  const itemName = (item.name || '').toLowerCase()
  const isChaimGoldberg = studentName === 'goldberg chaim' || studentName === 'chaim goldberg'
  const isCandyItem = itemName.includes('sour') || itemName.includes('candy') || itemName.includes('candies') || itemName.includes('lolly') || item.emoji === '🍬' || item.emoji === '🍭'
  return isChaimGoldberg && isCandyItem
}

export const S = {
  app: { fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: 'linear-gradient(180deg, #f4f8fc 0%, #f8fbff 100%)', color: '#223046', display: 'flex', letterSpacing: '-0.01em' },
  sidebar: { width: 244, background: 'linear-gradient(180deg, #23344b 0%, #1d2b3c 100%)', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto', overflowX: 'hidden', boxShadow: '8px 0 24px rgba(31,44,63,0.10)' },
  sidebarLogo: { padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 10, flexShrink: 0 },
  sidebarItem: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderRadius: 10, margin: '3px 10px', background: active ? '#eef4fb' : 'transparent', color: active ? '#223046' : 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: active ? 700 : 500, transition: 'background 0.15s, color 0.15s, transform 0.15s', flexShrink: 0 }),
  main: { marginLeft: 244, padding: '32px 56px 50px 40px', minHeight: '100vh', flex: 1, width: 'calc(100% - 244px)', boxSizing: 'border-box' } as CSSProperties,
  card: { background: '#ffffff', borderRadius: 16, padding: '22px', boxShadow: '0 12px 30px rgba(15,23,42,0.04)', border: '1px solid #dfe8f2' },
  statCard: (color: string) => ({ background: '#ffffff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 12px 30px rgba(15,23,42,0.04)', border: '1px solid #dfe8f2', borderLeft: `3px solid ${color}` }),
  badge: (color: string, bg: string) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant: keyof typeof buttonVariants) => {
    const map = { primary: ['#48698d','#fff'], danger: ['#a24860','#fff'], ghost: ['#eef3f8','#41556d'], success: ['#5a7a66','#fff'], purple: ['#6b7088','#fff'], gold: ['#8a7245','#fff8df'] } as const
    return { padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1], transition: 'transform 0.15s, box-shadow 0.15s' }
  },
  tag: (color: string, background?: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: background || color + '10', color, border: `1px solid ${color}22` }),
  avatar: (idx: number, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }),
}

export const buttonVariants = { primary: true, danger: true, ghost: true, success: true, purple: true, gold: true } as const

export function getViewportWidth() {
  if (typeof window === 'undefined') return Number.POSITIVE_INFINITY
  return Math.round(window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth)
}

export function useCompactViewport(maxWidth = 1080) {
  const [isCompact, setIsCompact] = useState(() => getViewportWidth() <= maxWidth)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateCompactState = () => setIsCompact(getViewportWidth() <= maxWidth)

    updateCompactState()
    window.addEventListener('resize', updateCompactState)
    window.addEventListener('orientationchange', updateCompactState)
    window.visualViewport?.addEventListener('resize', updateCompactState)
    return () => {
      window.removeEventListener('resize', updateCompactState)
      window.removeEventListener('orientationchange', updateCompactState)
      window.visualViewport?.removeEventListener('resize', updateCompactState)
    }
  }, [maxWidth])

  return isCompact
}
