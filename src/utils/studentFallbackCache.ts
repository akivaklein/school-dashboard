const STUDENT_PATCH_FALLBACK_KEY = 'schoolDashboardStudentPatchFallback'

export function readStudentFallbackPatches(): Record<string, Record<string, unknown>> {
  if (typeof window === 'undefined' || !window.localStorage) return {}

  try {
    const raw = window.localStorage.getItem(STUDENT_PATCH_FALLBACK_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, Record<string, unknown>>)
      : {}
  } catch {
    return {}
  }
}

function writeStudentFallbackPatches(patches: Record<string, Record<string, unknown>>) {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    window.localStorage.setItem(STUDENT_PATCH_FALLBACK_KEY, JSON.stringify(patches))
  } catch {
    // Ignore localStorage write errors.
  }
}

export function mergeStudentFallbackPatch(id: number | string, fields: Record<string, unknown>) {
  const patches = readStudentFallbackPatches()
  const targetId = String(id)

  patches[targetId] = {
    ...(patches[targetId] || {}),
    ...fields,
    _savedAt: new Date().toISOString(),
  }

  writeStudentFallbackPatches(patches)
}

export function clearStudentFallbackPatch(id: number | string) {
  const patches = readStudentFallbackPatches()
  const targetId = String(id)

  if (!(targetId in patches)) return

  delete patches[targetId]
  writeStudentFallbackPatches(patches)
}

export function getStudentFallbackPatchCount() {
  return Object.keys(readStudentFallbackPatches()).length
}
