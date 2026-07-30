function sortTodosByDateAndTime(todos) {
  return [...todos].sort((left, right) => {
    const leftDate = left.date || ''
    const rightDate = right.date || ''

    if (leftDate !== rightDate) {
      return leftDate < rightDate ? 1 : -1
    }

    const leftTime = left.time || ''
    const rightTime = right.time || ''

    if (leftTime !== rightTime) {
      return leftTime < rightTime ? -1 : 1
    }

    return Number(left.id || 0) - Number(right.id || 0)
  })
}

export function groupTodosByStatus(todos) {
  const grouped = todos.reduce(
    (groups, todo) => {
      if (todo.done) groups.completed.push(todo)
      else groups.pending.push(todo)
      return groups
    },
    { pending: [], completed: [] },
  )

  return {
    pending: sortTodosByDateAndTime(grouped.pending),
    completed: sortTodosByDateAndTime(grouped.completed),
  }
}
