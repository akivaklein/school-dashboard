const STUDENT_PATCH_FALLBACK_KEY = 'schoolDashboardStudentPatchFallback'

export function readStudentFallbackPatches() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STUDENT_PATCH_FALLBACK_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStudentFallbackPatches(patches) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STUDENT_PATCH_FALLBACK_KEY, JSON.stringify(patches))
  } catch {
    // Ignore localStorage errors.
  }
}

export function mergeStudentFallbackPatch(id, fields) {
  const patches = readStudentFallbackPatches()
  patches[String(id)] = {
    ...(patches[String(id)] || {}),
    ...fields,
    _savedAt: new Date().toISOString(),
  }
  writeStudentFallbackPatches(patches)
}

export function clearStudentFallbackPatch(id) {
  const patches = readStudentFallbackPatches()
  if (!(String(id) in patches)) return
  delete patches[String(id)]
  writeStudentFallbackPatches(patches)
}

export function getStudentFallbackPatchCount() {
  return Object.keys(readStudentFallbackPatches()).length
}
