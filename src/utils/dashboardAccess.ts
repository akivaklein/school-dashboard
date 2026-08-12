export const ALLOWED_DASHBOARD_ROLES = ['admin', 'teacher', 'rebbe', 'support_staff'] as const

export const NO_PROFILE_MESSAGE = 'Your account is active, but no staff profile is assigned. Contact an administrator.'
export const NO_ACTIVE_ROLE_MESSAGE = 'Access denied. This account is missing a permitted active role.'
export const CONFLICTING_ROLES_MESSAGE = 'This account has multiple conflicting staff role records. Contact an administrator.'
export const ROLE_LOOKUP_FAILED_MESSAGE = 'Could not verify your dashboard access right now. Please try again or contact an administrator.'

export type UserRoleRecord = {
  role?: string | null
  display_name?: string | null
  is_active?: boolean | null
}

export type DashboardAccessResult =
  | { status: 'granted'; user: { role: string; name: string } }
  | { status: 'denied'; message: string }

export function resolveDashboardAccess(rows: UserRoleRecord[] | null | undefined): DashboardAccessResult {
  const allRows = Array.isArray(rows) ? rows.filter(row => !!row) : []

  if (allRows.length === 0) {
    return { status: 'denied', message: NO_PROFILE_MESSAGE }
  }

  const allowed = new Set<string>(ALLOWED_DASHBOARD_ROLES)
  const usable = allRows
    .map(row => ({ ...row, normalizedRole: String(row.role || '').trim().toLowerCase() }))
    .filter(row => row.is_active !== false && allowed.has(row.normalizedRole))

  if (usable.length === 0) {
    return { status: 'denied', message: NO_ACTIVE_ROLE_MESSAGE }
  }

  const uniqueRoles = new Set(usable.map(row => row.normalizedRole))
  if (uniqueRoles.size > 1) {
    return { status: 'denied', message: CONFLICTING_ROLES_MESSAGE }
  }

  const [record] = usable
  const fallbackName = record.normalizedRole === 'admin' ? 'Yeshiva Ketana Admin' : 'Staff User'

  return {
    status: 'granted',
    user: {
      role: record.normalizedRole,
      name: String(record.display_name || '').trim() || fallbackName,
    },
  }
}
