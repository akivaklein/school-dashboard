export type SupportSourceResult<T> = {
  data: T | null
  error: string | null
}

function errorDetails(error: unknown): { code: string; message: string } {
  if (error instanceof Error) return { code: '', message: error.message }
  if (error && typeof error === 'object') {
    const value = error as { code?: unknown; message?: unknown; details?: unknown }
    return {
      code: typeof value.code === 'string' ? value.code : '',
      message: [value.message, value.details].filter(part => typeof part === 'string' && part).join(' - ') || 'Unknown request error',
    }
  }
  return { code: '', message: String(error || 'Unknown request error') }
}

export function describeSupportSourceError(label: string, source: string, error: unknown): string {
  const details = errorDetails(error)
  const prefix = `${label} could not load from ${source}`
  if (/failed to fetch|fetch failed|networkerror|network request failed/i.test(details.message)) {
    return `${prefix}: network request failed. Check the connection and try again.`
  }
  const code = details.code ? ` (${details.code})` : ''
  return `${prefix}${code}: ${details.message}`
}

export async function loadStudentSupportSources<Goals, Observations>(input: {
  loadGoals: () => Promise<Goals>
  loadObservations: () => Promise<Observations>
}): Promise<{
  goals: SupportSourceResult<Goals>
  observations: SupportSourceResult<Observations>
}> {
  const [goals, observations] = await Promise.allSettled([
    input.loadGoals(),
    input.loadObservations(),
  ])

  return {
    goals: goals.status === 'fulfilled'
      ? { data: goals.value, error: null }
      : { data: null, error: describeSupportSourceError('Goals', 'student_goals', goals.reason) },
    observations: observations.status === 'fulfilled'
      ? { data: observations.value, error: null }
      : { data: null, error: describeSupportSourceError('Observations', 'student_notes', observations.reason) },
  }
}