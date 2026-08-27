export type PermissionLevel = 'none' | 'view' | 'add' | 'edit' | 'delete'

export type PermissionMatrix = Record<string, PermissionLevel>

export const PERMISSION_LEVELS: PermissionLevel[] = ['none', 'view', 'add', 'edit', 'delete']

export const PERMISSION_SECTIONS = [
  { key: 'students', label: 'Students' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'grades', label: 'Grades' },
  { key: 'behavior', label: 'Behavior' },
  { key: 'store', label: 'Store' },
  { key: 'reports', label: 'Reports' },
  { key: 'setup', label: 'Setup' },
  { key: 'users', label: 'Users' },
] as const

const DEFAULT_PERMISSIONS: Record<string, PermissionMatrix> = {
  admin: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'view', setup: 'delete', users: 'delete' },
  principal: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'view', setup: 'delete', users: 'delete' },
  teacher: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  rebbe: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  support_staff: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  register: { students: 'none', attendance: 'none', grades: 'none', behavior: 'none', store: 'add', reports: 'none', setup: 'none', users: 'none' },
}

export const LEADERSHIP_ROLES = ['admin', 'principal']

// Leadership sees and edits the whole school, regardless of teacher/student assignment.
export function isLeadershipRole(role?: string | null): boolean {
  return LEADERSHIP_ROLES.includes(String(role || '').trim().toLowerCase())
}

export function defaultPermissionsForRole(role: string): PermissionMatrix {
  return { ...(DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.support_staff) }
}

export function mergePermissionsForRole(role: string, permissions?: unknown): PermissionMatrix {
  const merged = defaultPermissionsForRole(role)
  if (!permissions || typeof permissions !== 'object') return merged

  for (const section of PERMISSION_SECTIONS) {
    const value = (permissions as Record<string, unknown>)[section.key]
    if (typeof value === 'string' && PERMISSION_LEVELS.includes(value as PermissionLevel)) {
      merged[section.key] = value as PermissionLevel
    }
  }

  return merged
}