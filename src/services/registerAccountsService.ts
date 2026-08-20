import { supabase } from '../supabaseClient'

export async function createRegisterAccount(input: {
  displayName: string
  email: string
  password: string
}) {
  const { data, error } = await supabase.functions.invoke('create-register-user', {
    body: input,
  })

  if (error) throw new Error(error.message || 'Unable to create register account.')
  if (data?.error) throw new Error(String(data.error))
  return data
}
