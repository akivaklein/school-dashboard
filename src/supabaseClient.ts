import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ednjpqtuttutoatahorn.supabase.co'

const supabaseAnonKey = 'sb_publishable_hcY49gcWEKJRcBl8t4W1eA_WIBsJ5VQ'


export const supabase = createClient(supabaseUrl, supabaseAnonKey)
