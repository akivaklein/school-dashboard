import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const hasValidUrl = typeof supabaseUrl === 'string' && isValidHttpUrl(supabaseUrl)
const hasValidAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.trim().length > 20

export const supabaseConfigError =
  !hasValidUrl || !hasValidAnonKey
    ? 'Invalid Supabase configuration. Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/token-store-web/.env.local, then restart Vite.'
    : ''

export const supabase = createClient(
  hasValidUrl ? supabaseUrl : 'https://example.invalid',
  hasValidAnonKey ? supabaseAnonKey : 'missing-anon-key',
)
