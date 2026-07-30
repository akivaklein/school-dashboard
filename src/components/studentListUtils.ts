import { matchesContextualSearch } from '../utils/contextualSearch'

export function buildStudentListViewModel({
  students,
  query = '',
  sortBy = 'name',
  sortDir = 'asc',
  page = 1,
  pageSize = 12,
}) {
  const filteredRows = (students || []).filter(student => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return true

    return matchesContextualSearch(q, [student.name, student.id, student.className, student.division])
  })

  const sortedRows = filteredRows.slice().sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    if (sortBy === 'name') {
      aValue = a.name || ''
      bValue = b.name || ''
    } else if (sortBy === 'id') {
      aValue = Number(a.id) || 0
      bValue = Number(b.id) || 0
    } else if (sortBy === 'className') {
      aValue = a.className || ''
      bValue = b.className || ''
    } else if (sortBy === 'points') {
      aValue = Number(a.points) || 0
      bValue = Number(b.points) || 0
    } else if (sortBy === 'reminders') {
      aValue = Number(a.reminders) || 0
      bValue = Number(b.reminders) || 0
    } else if (sortBy === 'attendance') {
      aValue = a.att?.filter((day: string) => day === 'P').length || 0
      bValue = b.att?.filter((day: string) => day === 'P').length || 0
    }

    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    filteredRows,
    sortedRows,
    visibleRows,
    totalPages,
    totalCount: sortedRows.length,
    safePage,
  }
}
