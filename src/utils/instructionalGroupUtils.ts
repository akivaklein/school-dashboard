type GroupLike = { id: string; period_id: string; status?: string }
type MembershipLike = { group_id: string; student_id: number }

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
