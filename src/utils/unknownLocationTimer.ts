export function formatUnknownDuration(unknownSince?: string | null): string {
  if (!unknownSince) return 'Just flagged'

  const sinceMs = new Date(unknownSince).getTime()
  if (!Number.isFinite(sinceMs)) return 'Needs update'

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - sinceMs) / 60000))

  if (elapsedMinutes < 1) return 'Less than 1 min'
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`

  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60
  return `${hours}h ${minutes}m`
}
