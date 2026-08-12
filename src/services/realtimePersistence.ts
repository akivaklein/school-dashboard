export type StudentNoteEntry = {
  id?: number | string
  date: string
  author: string
  text: string
}

export type SupportSessionEntry = {
  id: number | string
  student_id?: number | string | null
  student_name?: string
  staff_id?: string | null
  staff_name?: string | null
  service_type?: string
  started_at?: string
  ended_at?: string | null
  return_location?: string | null
  notes?: string | null
  goal_worked_on?: string | null
  student_response?: string | null
  follow_up_needed?: boolean
  [key: string]: unknown
}

export function mergeStudentNoteEntries(existing: StudentNoteEntry[], next: StudentNoteEntry, eventType: string = 'INSERT') {
  const id = next.id ?? `${next.date}|${next.author}|${next.text}`

  if (eventType === 'DELETE') {
    return existing.filter(entry => String(entry.id ?? `${entry.date}|${entry.author}|${entry.text}`) !== String(id))
  }

  const withoutCurrent = existing.filter(entry => String(entry.id ?? `${entry.date}|${entry.author}|${entry.text}`) !== String(id))
  return [next, ...withoutCurrent]
}

export function mergeSupportSessionEntries<T extends { id: number | string }>(existing: T[], next: T, eventType: string = 'INSERT'): T[] {
  const id = Number(next.id)

  if (eventType === 'DELETE') {
    return existing.filter(entry => Number(entry.id) !== id)
  }

  const withoutCurrent = existing.filter(entry => Number(entry.id) !== id)
  return [next, ...withoutCurrent]
}
