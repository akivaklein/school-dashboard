type GroupLike = { id: string; period_id: string; status?: string }
type MembershipLike = { group_id: string; student_id: number }
type PeriodLike = { id: string; start_time?: string | null; end_time?: string | null; status?: string; sort_order?: number }

function timeToMinutes(value?: string | null): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function getCurrentInstructionalPeriod<T extends PeriodLike>(periods: T[], now = new Date()): T | null {
  const weekday = now.getDay()
  if (weekday === 0 || weekday >= 5) return null

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return [...periods]
    .filter(period => period.status !== 'archived')
    .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
    .find(period => {
      const start = timeToMinutes(period.start_time)
      const end = timeToMinutes(period.end_time)
      return start !== null && end !== null && currentMinutes >= start && currentMinutes < end
    }) || null
}

export function getInstructionalGroupStudentIds(groupId: string, memberships: MembershipLike[]): number[] {
  return memberships
    .filter(membership => membership.group_id === groupId)
    .map(membership => Number(membership.student_id))
    .filter(Number.isFinite)
}

export function getStudentInstructionalGroup<T extends GroupLike>(
  studentId: number | string,
  periodId: string,
  groups: T[],
  memberships: MembershipLike[],
): T | null {
  const studentGroupIds = new Set(memberships
    .filter(membership => Number(membership.student_id) === Number(studentId))
    .map(membership => membership.group_id))
  return groups.find(group => group.status !== 'archived' && group.period_id === periodId && studentGroupIds.has(group.id)) || null
}

export function getActiveTeacherStaff<T extends { role?: string; roles?: string[]; active?: boolean }>(staff: T[]): T[] {
  return staff.filter(member => {
    if (member.active === false) return false
    const roleText = [member.role, ...(Array.isArray(member.roles) ? member.roles : [])].filter(Boolean).join(' ').toLowerCase()
    return /(^|[^a-z])(teacher|rebbe)([^a-z]|$)/.test(roleText)
  })
}

export function findInstructionalGroupConflict(
  studentIds: number[],
  periodId: string,
  groups: GroupLike[],
  memberships: MembershipLike[],
  editingGroupId?: string | null,
): number | null {
  const activeGroupIds = new Set(groups
    .filter(group => group.status !== 'archived' && group.period_id === periodId && group.id !== editingGroupId)
    .map(group => group.id))
  return studentIds.find(studentId => memberships.some(member => member.student_id === studentId && activeGroupIds.has(member.group_id))) ?? null
}
