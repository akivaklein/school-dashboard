import { supabase } from '../supabaseClient'

// Persisted class definitions (Setup > Classes & Divisions). Classes created
// via "+ Add Class" must survive refresh/logout/another device.

export type PersistedClass = {
  id: string
  name: string
  grade: string
  teacher: string
  division_key: string
}

export async function loadClasses(): Promise<PersistedClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error loading classes:', error)
    return []
  }
  return (data || []) as PersistedClass[]
}

export async function upsertClass(input: {
  id: string
  name: string
  grade: string
  teacher: string
  divisionKey: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('classes')
    .upsert(
      {
        id: input.id,
        name: input.name,
        grade: input.grade,
        teacher: input.teacher,
        division_key: input.divisionKey,
      },
      { onConflict: 'id' },
    )

  if (error) {
    console.error('Error saving class:', error)
    return false
  }
  return true
}
