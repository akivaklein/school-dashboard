import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedRoles = new Set(['admin', 'teacher', 'rebbe', 'support_staff', 'register'])
const permissionLevels = new Set(['none', 'view', 'add', 'edit', 'delete'])
const permissionSections = ['students', 'attendance', 'grades', 'behavior', 'store', 'reports', 'setup', 'users']

const defaultPermissionsByRole: Record<string, Record<string, string>> = {
  admin: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'view', setup: 'delete', users: 'delete' },
  teacher: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  rebbe: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  support_staff: { students: 'delete', attendance: 'delete', grades: 'delete', behavior: 'delete', store: 'delete', reports: 'delete', setup: 'delete', users: 'delete' },
  register: { students: 'none', attendance: 'none', grades: 'none', behavior: 'none', store: 'add', reports: 'none', setup: 'none', users: 'none' },
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function normalizeRole(role: unknown) {
  const value = String(role || '').trim().toLowerCase()
  if (!allowedRoles.has(value)) throw new Error('Choose a valid base role.')
  return value
}

function normalizePermissions(role: string, permissions: unknown) {
  const base = { ...(defaultPermissionsByRole[role] || defaultPermissionsByRole.support_staff) }
  if (!permissions || typeof permissions !== 'object') return base

  for (const section of permissionSections) {
    const value = String((permissions as Record<string, unknown>)[section] || '').trim().toLowerCase()
    if (permissionLevels.has(value)) base[section] = value
  }

  return base
}

async function assertAdmin(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient
    .from('user_roles')
    .select('role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || data?.role !== 'admin') throw new Error('Only administrators can manage dashboard users.')
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(error.message || 'Unable to inspect users.')
  return (data?.users || []).find(user => String(user.email || '').toLowerCase() === email.toLowerCase()) || null
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization') || ''
    const token = authorization.replace(/^Bearer\s+/i, '')
    if (!token) throw new Error('Authentication required.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const appUrl = (Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'https://yeshiva-ketana-secure.vercel.app').replace(/\/$/, '')
    if (!supabaseUrl || !serviceRoleKey || !anonKey) throw new Error('Server configuration is incomplete.')

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: authData, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authData.user) throw new Error('Authentication required.')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    await assertAdmin(adminClient, authData.user.id)

    const body = await request.json()
    const action = String(body.action || '').trim().toLowerCase()

    if (action === 'list') {
      const [{ data: roles, error: rolesError }, { data: users, error: usersError }] = await Promise.all([
        adminClient.from('user_roles').select('user_id, role, display_name, is_active, permissions, invited_at, created_at').order('display_name'),
        adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ])
      if (rolesError || usersError) throw new Error(rolesError?.message || usersError?.message || 'Unable to load users.')
      const usersById = new Map((users?.users || []).map(user => [user.id, user]))
      return jsonResponse((roles || []).map(role => {
        const user = usersById.get(role.user_id)
        return {
          id: role.user_id,
          email: user?.email || '',
          displayName: role.display_name || user?.user_metadata?.display_name || '',
          role: role.role,
          permissions: normalizePermissions(role.role, role.permissions),
          active: role.is_active !== false,
          invitedAt: role.invited_at || null,
          createdAt: user?.created_at || role.created_at || null,
          lastSignInAt: user?.last_sign_in_at || null,
        }
      }))
    }

    if (action === 'invite') {
      const displayName = String(body.displayName || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const role = normalizeRole(body.role)
      const permissions = normalizePermissions(role, body.permissions)
      if (!displayName) throw new Error('Name is required.')
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email is required.')

      let user = await findAuthUserByEmail(adminClient, email)
      if (!user) {
        const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { display_name: displayName, invited_role: role },
          redirectTo: `${appUrl}/reset-password`,
        })
        if (inviteError || !invited.user) throw new Error(inviteError?.message || 'Unable to send invite email.')
        user = invited.user
      }

      const { error: roleError } = await adminClient.from('user_roles').upsert({
        user_id: user.id,
        role,
        display_name: displayName,
        is_active: true,
        permissions,
        invited_at: new Date().toISOString(),
        invited_by: authData.user.id,
      }, { onConflict: 'user_id' })
      if (roleError) throw new Error(roleError.message || 'Unable to assign user access.')

      return jsonResponse({ id: user.id, email, displayName, role, permissions }, user.created_at ? 200 : 201)
    }

    if (action === 'update') {
      const userId = String(body.userId || '').trim()
      const displayName = String(body.displayName || '').trim()
      const role = normalizeRole(body.role)
      const permissions = normalizePermissions(role, body.permissions)
      const active = body.active !== false
      if (!userId) throw new Error('User is required.')
      if (!displayName) throw new Error('Name is required.')

      const { error: updateError } = await adminClient.from('user_roles').update({
        role,
        display_name: displayName,
        is_active: active,
        permissions,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
      if (updateError) throw new Error(updateError.message || 'Unable to update user access.')

      await adminClient.auth.admin.updateUserById(userId, { user_metadata: { display_name: displayName } })
      return jsonResponse({ id: userId, displayName, role, active, permissions })
    }

    throw new Error('Unsupported action.')
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to manage dashboard users.' }, 400)
  }
})
