import { supabase } from '../supabaseClient'
import { mergePermissionsForRole, type PermissionMatrix } from '../utils/permissions'

async function throwFunctionError(error: unknown, fallback: string): Promise<never> {
  const candidate = error as { message?: string; context?: Response }
  if (candidate?.context) {
    try {
      const body = await candidate.context.clone().json()
      if (body?.error) throw new Error(String(body.error))
    } catch (contextError) {
      if (contextError instanceof Error && contextError.message !== 'Unexpected end of JSON input') throw contextError
    }
  }
  throw new Error(candidate?.message || fallback)
}

export type ManagedDashboardUser = {
  id: string
  email: string
  displayName: string
  role: string
  active: boolean
  permissions: PermissionMatrix
  invitedAt: string | null
  createdAt: string | null
  lastSignInAt: string | null
}

export async function listDashboardUsers(): Promise<ManagedDashboardUser[]> {
  const { data, error } = await supabase.functions.invoke('manage-dashboard-user', {
    body: { action: 'list' },
  })

  if (error) await throwFunctionError(error, 'Unable to load users.')
  if (data?.error) throw new Error(String(data.error))
  return Array.isArray(data) ? data : []
}

export async function inviteDashboardUser(input: {
  displayName: string
  email: string
  role: string
  permissions: PermissionMatrix
}) {
  const role = input.role
  const { data, error } = await supabase.functions.invoke('manage-dashboard-user', {
    body: {
      action: 'invite',
      displayName: input.displayName,
      email: input.email,
      role,
      permissions: mergePermissionsForRole(role, input.permissions),
    },
  })

  if (error) await throwFunctionError(error, 'Unable to invite user.')
  if (data?.error) throw new Error(String(data.error))
  return data
}

export async function updateDashboardUser(input: {
  userId: string
  displayName: string
  role: string
  active: boolean
  permissions: PermissionMatrix
}) {
  const { data, error } = await supabase.functions.invoke('manage-dashboard-user', {
    body: {
      action: 'update',
      userId: input.userId,
      displayName: input.displayName,
      role: input.role,
      active: input.active,
      permissions: mergePermissionsForRole(input.role, input.permissions),
    },
  })

  if (error) await throwFunctionError(error, 'Unable to update user.')
  if (data?.error) throw new Error(String(data.error))
  return data
}
