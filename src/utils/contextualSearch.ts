export function matchesContextualSearch(query: string, fields: Array<string | number | null | undefined>): boolean {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return true

  return fields.some(field => {
    if (field == null) return false
    const text = String(field).trim().toLowerCase()
    return text.includes(normalizedQuery)
  })
}
