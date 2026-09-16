export type ReminderTask = {
  id: string
  student_id: number
  title: string
  note: string | null
  due_at: string
  reminder_start_at: string | null
  snoozed_until: string | null
  completed_at?: string | null
  notification_preference: string
  notification_cycle: string
}

export type DeliveryRecord = {
  task_id: string
  notification_cycle: string
  status: 'pending' | 'sent' | 'failed'
}

export function isEmailEligible(task: ReminderTask) {
  return task.notification_preference === 'email' || task.notification_preference === 'email_text'
}

export function getNotificationTime(task: ReminderTask) {
  const reminderTime = task.reminder_start_at ? new Date(task.reminder_start_at).getTime() : new Date(task.due_at).getTime()
  const snoozeTime = task.snoozed_until ? new Date(task.snoozed_until).getTime() : 0
  return new Date(Math.max(reminderTime, snoozeTime))
}

export function isReadyToSend(task: ReminderTask, now = new Date()) {
  return !task.completed_at && isEmailEligible(task) && getNotificationTime(task).getTime() <= now.getTime()
}

export function hasAlreadySent(deliveries: DeliveryRecord[], task: ReminderTask) {
  return deliveries.some(delivery => delivery.task_id === task.id && delivery.notification_cycle === task.notification_cycle && delivery.status === 'sent')
}

export function buildSecureTaskUrl(appUrl: string, taskId: string) {
  const url = new URL(appUrl)
  url.searchParams.set('studentTask', taskId)
  return url.toString()
}

export function buildEmailHtml(task: ReminderTask, studentName: string, appUrl: string) {
  const taskUrl = buildSecureTaskUrl(appUrl, task.id)
  const due = new Date(task.due_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
  const note = task.note ? `<p><strong>Note:</strong> ${escapeHtml(task.note)}</p>` : ''
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033"><h2>Student reminder</h2><p><strong>Student:</strong> ${escapeHtml(studentName)}</p><p><strong>Task:</strong> ${escapeHtml(task.title)}</p>${note}<p><strong>Due:</strong> ${escapeHtml(due)}</p><p><a href="${escapeHtml(taskUrl)}">Open secure dashboard</a></p></div>`
}

export function providerFailureMessage(status: number, body: { message?: string } = {}) {
  return body.message || `Email provider returned HTTP ${status}`
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}
