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
  teacher: { students: 'view', attendance: 'edit', grades: 'edit', behavior: 'add', store: 'view', reports: 'none', setup: 'none', users: 'none' },
  rebbe: { students: 'view', attendance: 'edit', grades: 'edit', behavior: 'add', store: 'view', reports: 'none', setup: 'none', users: 'none' },
  support_staff: { students: 'view', attendance: 'view', grades: 'view', behavior: 'add', store: 'view', reports: 'none', setup: 'none', users: 'none' },
  register: { students: 'none', attendance: 'none', grades: 'none', behavior: 'none', store: 'add', reports: 'none', setup: 'none', users: 'none' },
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

  if (role !== 'admin') {
    merged.users = 'none'
    if (merged.setup === 'delete') merged.setup = 'edit'
  }

  return merged
}