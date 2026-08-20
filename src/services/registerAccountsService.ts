import { supabase } from '../supabaseClient'

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

export async function createRegisterAccount(input: {
  displayName: string
  password: string
}) {
  const { data, error } = await supabase.functions.invoke('create-register-user', {
    body: input,
  })

  if (error) await throwFunctionError(error, 'Unable to create register account.')
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
  if (error) await throwFunctionError(error, 'Unable to load register accounts.')
  if (data?.error) throw new Error(String(data.error))
  return Array.isArray(data) ? data : []
}

export async function resetRegisterPin(userId: string, password: string) {
  const { data, error } = await supabase.functions.invoke('create-register-user', {
    body: { action: 'reset-pin', userId, password },
  })
  if (error) await throwFunctionError(error, 'Unable to reset register PIN.')
  if (data?.error) throw new Error(String(data.error))
}
