import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function registerAccountEmail(displayName: string) {
  const slug = displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `register-${slug || 'account'}@yeshiva-ketana.local`
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization') || ''
    const token = authorization.replace(/^Bearer\s+/i, '')
    if (!token) throw new Error('Authentication required.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Server configuration is incomplete.')

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: authData, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authData.user) throw new Error('Authentication required.')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: actorRole, error: actorRoleError } = await adminClient
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (actorRoleError || actorRole?.role !== 'admin') throw new Error('Only administrators can create register accounts.')

    const body = await request.json()
    if (body.action === 'list') {
      const [{ data: roles, error: rolesError }, { data: authUsers, error: usersError }] = await Promise.all([
        adminClient.from('user_roles').select('user_id, display_name, is_active, created_at').eq('role', 'register').order('display_name'),
        adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ])
      if (rolesError || usersError) throw new Error(rolesError?.message || usersError?.message || 'Unable to load register accounts.')
      const usersById = new Map((authUsers?.users || []).map(user => [user.id, user]))
      return new Response(JSON.stringify((roles || []).map(role => {
        const user = usersById.get(role.user_id)
        return {
          id: role.user_id,
          displayName: role.display_name,
          active: role.is_active !== false && user?.banned_until !== 'none',
          createdAt: user?.created_at || role.created_at || null,
          lastSignInAt: user?.last_sign_in_at || null,
        }
      })), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const displayName = String(body.displayName || '').trim()
    const password = String(body.password || '')
    const email = registerAccountEmail(displayName)
    if (!displayName || !/^\d{4}$/.test(password)) {
      throw new Error('Register name and a 4-digit PIN are required.')
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, account_type: 'register' },
    })
    if (createError || !created.user) throw new Error(createError?.message || 'Unable to create register account.')

    const { error: roleError } = await adminClient.from('user_roles').insert({
      user_id: created.user.id,
      role: 'register',
      display_name: displayName,
      is_active: true,
    })
    if (roleError) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      throw new Error(roleError.message || 'Unable to assign register access.')
    }

    return new Response(JSON.stringify({ id: created.user.id, email, displayName, role: 'register' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to create register account.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
