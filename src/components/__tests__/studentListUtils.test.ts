import { describe, expect, it } from 'vitest'
import { buildStudentListViewModel } from '../studentListUtils'

describe('buildStudentListViewModel', () => {
  it('filters, sorts, and paginates the student list for the selected view', () => {
    const students = [
      { id: 3, name: 'Ari Klein', className: 'Alef', division: 'mesivta', points: 20, reminders: 2, att: ['P', 'P', 'P'] },
      { id: 1, name: 'Ben Levi', className: 'Bet', division: 'yeshiva-ketana', points: 40, reminders: 5, att: ['P'] },
      { id: 2, name: 'Chaim Gold', className: 'Alef', division: 'mesivta', points: 30, reminders: 1, att: ['P', 'P'] },
    ]

    const viewModel = buildStudentListViewModel({
      students,
      query: 'a',
      sortBy: 'points',
      sortDir: 'desc',
      page: 1,
      pageSize: 2,
    })

    expect(viewModel.filteredRows.map(student => student.id)).toEqual([3, 1, 2])
    expect(viewModel.visibleRows.map(student => student.id)).toEqual([1, 2])
    expect(viewModel.totalPages).toBe(2)
    expect(viewModel.totalCount).toBe(3)
  })
})
