export type ReminderTask = {
  id: string
  student_id: number
  title: string
  note: string | null
  due_at: string
  reminder_start_at: string | null
  snoozed_until: string | null
  completed_at?: string | null
  skipped_at?: string | null
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

export function isSmsEligible(task: ReminderTask) {
  return task.notification_preference === 'text' || task.notification_preference === 'email_text'
}

export function getNotificationTime(task: ReminderTask) {
  const reminderTime = task.reminder_start_at ? new Date(task.reminder_start_at).getTime() : new Date(task.due_at).getTime()
  const snoozeTime = task.snoozed_until ? new Date(task.snoozed_until).getTime() : 0
  return new Date(Math.max(reminderTime, snoozeTime))
}

export function isReadyToSend(task: ReminderTask, now = new Date()) {
  return !task.completed_at && !task.skipped_at && (isEmailEligible(task) || isSmsEligible(task)) && getNotificationTime(task).getTime() <= now.getTime()
}

export function hasAlreadySent(deliveries: DeliveryRecord[], task: ReminderTask) {
  return deliveries.some(delivery => delivery.task_id === task.id && delivery.notification_cycle === task.notification_cycle && delivery.status === 'sent')
}

export function buildSecureTaskUrl(appUrl: string, taskId: string) {
  const url = new URL(appUrl)
  url.searchParams.set('studentTask', taskId)
  return url.toString()
}

export function isTaskOverdue(task: ReminderTask, now = new Date()) {
  return new Date(task.due_at).getTime() < now.getTime()
}

export function buildEmailSubject(task: ReminderTask, studentName: string, now = new Date()) {
  const overduePrefix = isTaskOverdue(task, now) ? 'Overdue: ' : 'Reminder: '
  return `${overduePrefix}${task.title} for ${studentName}`
}

export function buildEmailHtml(task: ReminderTask, studentName: string, appUrl: string, now = new Date()) {
  const taskUrl = buildSecureTaskUrl(appUrl, task.id)
  const due = new Date(task.due_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
  const overdue = isTaskOverdue(task, now)
  const noteRow = task.note
    ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:110px;vertical-align:top">Note</td><td style="padding:6px 0;color:#172033;font-size:14px">${escapeHtml(task.note)}</td></tr>`
    : ''
  const overdueBanner = overdue
    ? `<div style="background:#fee2e2;color:#9f1239;font-weight:700;font-size:13px;padding:10px 16px;border-radius:8px;margin-bottom:16px">⚠️ This task is overdue</div>`
    : ''
  return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#172033;max-width:480px;margin:0 auto">
  <h2 style="margin:0 0 14px;font-size:18px;color:#0f172a">${overdue ? 'Overdue student reminder' : 'Student reminder'}</h2>
  ${overdueBanner}
  <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:110px">Student</td><td style="padding:6px 0;color:#172033;font-size:14px;font-weight:700">${escapeHtml(studentName)}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:110px">Task</td><td style="padding:6px 0;color:#172033;font-size:14px;font-weight:700">${escapeHtml(task.title)}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:110px">Due</td><td style="padding:6px 0;color:${overdue ? '#9f1239' : '#172033'};font-size:14px;font-weight:${overdue ? '700' : '400'}">${escapeHtml(due)}</td></tr>
    ${noteRow}
  </table>
  <a href="${escapeHtml(taskUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 18px;border-radius:8px">Open secure dashboard</a>
</div>`
}

export function buildSmsText(task: ReminderTask, studentName: string, appUrl: string) {
  const due = new Date(task.due_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
  return `Hadran Reminder: ${studentName} - ${task.title}. Due ${due}. ${appUrl}`
}

export function providerFailureMessage(status: number, body: { message?: string } = {}) {
  return body.message || `Email provider returned HTTP ${status}`
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}
