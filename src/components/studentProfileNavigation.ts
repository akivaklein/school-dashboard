export function getStudentNavigationPair<T extends { id: string | number }>(students: T[], currentStudentId: string | number | null | undefined) {
  if (!Array.isArray(students) || students.length === 0 || currentStudentId == null) {
    return { previous: null, next: null }
  }

  const index = students.findIndex(student => Number(student.id) === Number(currentStudentId))
  if (index === -1) return { previous: null, next: null }

  return {
    previous: index > 0 ? students[index - 1] : null,
    next: index < students.length - 1 ? students[index + 1] : null,
  }
}
