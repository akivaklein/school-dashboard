import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_YK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_YK_ANON_KEY
const serviceRoleHint = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Missing Supabase environment variables. Set VITE_SUPABASE_YK_URL and VITE_SUPABASE_YK_ANON_KEY.')
}

if (serviceRoleHint) {
	console.error('Refusing to use a service-role key in the browser client. Keep VITE_SUPABASE_SERVICE_ROLE_KEY server-only.')
}

export const supabase = createClient(
	supabaseUrl || 'https://example.invalid',
	supabaseAnonKey || 'missing-anon-key',
)
