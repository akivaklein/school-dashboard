import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildMissingOccurrenceInserts, type SeriesTip } from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yeshiva-ketana-secure.vercel.app',
  'Access-Control-Allow-Headers': 'content-type, x-task-occurrence-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Keeps calendar-based recurring series (every day / weekdays / specific days) scheduled
// indefinitely, independent of anyone opening the app or pressing Done.
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  const cronSecret = Deno.env.get('TASK_OCCURRENCE_CRON_SECRET') || ''
  if (!cronSecret || request.headers.get('x-task-occurrence-cron-secret') !== cronSecret) return response({ error: 'Unauthorized.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !serviceRoleKey) return response({ error: 'Server configuration is incomplete.' }, 500)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = new Date()
  const { data, error } = await admin.from('student_task_series_tips').select('*')
  if (error) return response({ error: error.message }, 500)

  const summary = { seriesConsidered: data?.length || 0, seriesCanceled: 0, occurrencesCreated: 0, failed: 0 }
  for (const tip of (data || []) as SeriesTip[]) {
    if (tip.recurrence_canceled_at) {
      summary.seriesCanceled += 1
      continue
    }
    const rows = buildMissingOccurrenceInserts(tip, now)
    if (rows.length === 0) continue
    const { error: insertError } = await admin
      .from('student_tasks')
      .upsert(rows, { onConflict: 'series_id,occurrence_number', ignoreDuplicates: true })
    if (insertError) {
      summary.failed += 1
      continue
    }
    summary.occurrencesCreated += rows.length
  }

  return response(summary)
})
