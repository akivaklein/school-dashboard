import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildEmailHtml, buildEmailSubject, buildSmsText, getNotificationTime, isEmailEligible, isReadyToSend, isSmsEligible, providerFailureMessage, type ReminderTask } from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yeshiva-ketana-secure.vercel.app',
  'Access-Control-Allow-Headers': 'content-type, x-task-email-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type TaskRow = ReminderTask & { students?: { name?: string } | null }

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  const cronSecret = Deno.env.get('TASK_EMAIL_CRON_SECRET') || ''
  if (!cronSecret || request.headers.get('x-task-email-cron-secret') !== cronSecret) return response({ error: 'Unauthorized.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || ''
  const recipientEmail = Deno.env.get('STUDENT_TASK_NOTIFICATION_EMAIL') || ''
  const connextApiKey = Deno.env.get('CONNEXT_API_KEY') || ''
  const connextReminderGroup = Number(Deno.env.get('CONNEXT_REMINDER_GROUP') || '')
  const appUrl = Deno.env.get('SECURE_APP_URL') || 'https://yeshiva-ketana-secure.vercel.app'
  if (!supabaseUrl || !serviceRoleKey || (!resendApiKey && !connextApiKey)) return response({ error: 'Reminder server configuration is incomplete.' }, 500)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = new Date()
  const { data, error } = await admin
    .from('student_tasks')
    .select('*, students(name)')
    .is('completed_at', null)
    .is('skipped_at', null)
    .in('notification_preference', ['email', 'text', 'email_text'])
    .limit(1000)

  if (error) return response({ error: error.message }, 500)

  const summary = { considered: data?.length || 0, sent: 0, skipped: 0, failed: 0 }
  for (const row of (data || []) as TaskRow[]) {
    if (!isReadyToSend(row, now)) {
      summary.skipped += 1
      continue
    }

    const channels = [
      ...(isEmailEligible(row) ? ['email'] : []),
      ...(isSmsEligible(row) ? ['sms'] : []),
    ]
    for (const channel of channels) {
      const recipient = channel === 'email' ? recipientEmail : `group:${connextReminderGroup}`
      const sender = channel === 'email' ? fromEmail : 'connext'
      if (!recipient || !sender || (channel === 'sms' && (!connextApiKey || !Number.isInteger(connextReminderGroup) || connextReminderGroup <= 0))) {
        summary.failed += 1
        continue
      }
      const { data: claimed, error: claimError } = await admin.rpc('claim_student_task_delivery', {
        p_task_id: row.id,
        p_notification_cycle: row.notification_cycle,
        p_channel: channel,
        p_recipient: recipient,
        p_sender: sender,
        p_scheduled_for: getNotificationTime(row).toISOString(),
      })
      if (claimError || claimed !== true) {
        summary.skipped += 1
        continue
      }

      try {
        let providerId = ''
        if (channel === 'email') {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: buildEmailSubject(row, row.students?.name || 'student', now),
          html: buildEmailHtml(row, row.students?.name || 'Student', appUrl, now),
        }),
      })
      const resendBody = await resendResponse.json().catch(() => ({})) as { id?: string; message?: string }
      if (!resendResponse.ok) throw new Error(providerFailureMessage(resendResponse.status, resendBody))
          providerId = resendBody.id || ''
        } else {
          const connextResponse = await fetch('https://api.connext.ms/api/v1/blasts/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${connextApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              types: ['sms'],
              groups: [connextReminderGroup],
              message: buildSmsText(row, row.students?.name || 'Student', appUrl),
            }),
          })
          const connextBody = await connextResponse.json().catch(() => ({})) as { message?: string }
          if (!connextResponse.ok) throw new Error(connextBody.message || `Connext returned ${connextResponse.status}`)
        }
        await admin.from('student_task_email_deliveries').update({ status: 'sent', provider_message_id: providerId || null, sent_at: new Date().toISOString(), last_error: null }).eq('task_id', row.id).eq('notification_cycle', row.notification_cycle).eq('channel', channel)
        summary.sent += 1
      } catch (sendError) {
        await admin.from('student_task_email_deliveries').update({ status: 'failed', last_error: sendError instanceof Error ? sendError.message : 'Provider failure' }).eq('task_id', row.id).eq('notification_cycle', row.notification_cycle).eq('channel', channel)
        summary.failed += 1
      }
    }
  }

  return response(summary)
})
