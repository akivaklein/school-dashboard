export function groupTodosByStatus(todos) {
  return todos.reduce(
    (groups, todo) => {
      if (todo.done) groups.completed.push(todo)
      else groups.pending.push(todo)
      return groups
    },
    { pending: [], completed: [] },
  )
}
