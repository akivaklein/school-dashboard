import { supabase } from '../supabaseClient'

export async function createRegisterAccount(input: {
  displayName: string
  password: string
}) {
  const { data, error } = await supabase.functions.invoke('create-register-user', {
    body: input,
  })

  if (error) throw new Error(error.message || 'Unable to create register account.')
  if (data?.error) throw new Error(String(data.error))
  return data
}

export type RegisterAccountSummary = {
  id: string
  displayName: string
  active: boolean
  createdAt: string | null
  lastSignInAt: string | null
}

export async function listRegisterAccounts(): Promise<RegisterAccountSummary[]> {
  const { data, error } = await supabase.functions.invoke('create-register-user', {
    body: { action: 'list' },
  })
  if (error) throw new Error(error.message || 'Unable to load register accounts.')
  if (data?.error) throw new Error(String(data.error))
  return Array.isArray(data) ? data : []
}
