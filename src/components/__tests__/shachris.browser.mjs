import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const screenshotDirectory = process.env.SHACHRIS_SCREENSHOT_DIR || 'docs'

const migration = readFileSync('supabase/migrations/20261005_shachris_checkpoint.sql', 'utf8')
const config = JSON.parse(migration.match(/values \('([\s\S]*?)'::jsonb\)/)[1])
config.stayMilestones = [
  { id: 'hodu', label: 'Start Hodu', order: 0 },
  { id: 'shemoneh-esrei', label: 'After Shemoneh Esrei', order: 1 },
  { id: 'chazaras-hashatz', label: 'After Chazaras HaShatz', order: 2 },
  { id: 'end-davening', label: 'End Davening', order: 3 },
]
config.stayRules = [
  { id: 'age-11', age: 11, milestoneId: 'shemoneh-esrei' },
  { id: 'age-12', age: 12, milestoneId: 'chazaras-hashatz' },
  { id: 'age-13', age: 13, milestoneId: 'end-davening' },
]
const settings = { config: structuredClone(config), revision: 0 }
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const session = { id: 'qa-session', session_date: today, config, started_at: null, started_by_name: '', milestone_times: {} }
let permission = 'edit'
let savedDob = '2014-11-28'
let eventMinute = 3
const progressionHistory = []
const stayHistory = []
const records = ['start', 'full', 'ashrei'].map((milestoneId, index) => {
  const progressMilestone = config.milestones.find(entry => entry.id === milestoneId)
  const age = 11 + index
  const stayMilestone = config.stayMilestones.find(entry => entry.id === config.stayRules.find(rule => rule.age === age).milestoneId)
  return {
    session_id: session.id,
    student_id: 1001 + index,
    expectation: { milestoneId, label: progressMilestone.label, sectionIds: [...progressMilestone.sectionIds], source: 'default' },
    stay_requirement: { age, requiredUntil: stayMilestone.id, label: stayMilestone.label, source: 'default' },
    presence: 'unmarked', arrival_at: null, last_return_at: null, leave_intervals: [],
    requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null,
    said_section_ids: [], rating_id: '', note: '', revision: 0, updated_by_name: '',
    late_minutes: null, late_reason: null, late_reason_note: '', late_excused: false, absence_status: null,
    personally_cleared_at: null, personally_cleared_by_name: '', personally_cleared_milestone: null, extra_stay_intervals: [], stayed_beyond_required: false,
  }
})

const priorDate = new Date(`${today}T12:00:00`)
priorDate.setDate(priorDate.getDate() - priorDate.getDay() - 6)
const priorDay = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}-${String(priorDate.getDate()).padStart(2, '0')}`
const priorSession = { ...session, id: 'qa-history', session_date: priorDay, config: { ...structuredClone(config), arrivalGraceMinutes: 0 }, started_at: `${priorDay}T07:00:00Z`, milestone_times: { 'shemoneh-esrei': `${priorDay}T07:30:00Z`, 'chazaras-hashatz': `${priorDay}T07:40:00Z`, 'end-davening': `${priorDay}T07:50:00Z` } }
const priorRecords = records.map((record, index) => ({ ...structuredClone(record), session_id: priorSession.id, presence: 'present', arrival_at: `${priorDay}T07:0${index === 1 ? 3 : 0}:00Z`, requirement_result: 'met', late_minutes: index === 1 ? 3 : 0, late_reason: index === 1 ? 'transportation' : null, late_excused: index === 1, note: 'Saved history note', leave_intervals: index === 0 ? [{ leftAt: `${priorDay}T07:35:00Z`, returnedAt: `${priorDay}T07:37:00Z`, permission: 'with' }] : [] }))
const requests = []
const freshRecordsTemplate = structuredClone(records)
const restartAudit = []
const voidedSessions = []
const voidedRecords = []
const historicalAudits = []
const backfillSessions = []
const backfillRecords = []
let rejectHistoricalSave = false

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript(() => { window.__SHACHRIS_BROWSER_TEST__ = true })
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.route('**/rest/v1/**', async route => {
  const request = route.request()
  const url = new URL(request.url())
  const name = url.pathname.split('/').at(-1)
  requests.push({ name, method: request.method() })
  const input = request.postDataJSON() || {}
  let response
  if (name === 'shachris_sessions') {
    assert.equal(request.method(), 'GET')
    assert.equal(url.searchParams.get('voided_at'), 'is.null')
    const bounds = url.searchParams.getAll('session_date')
    const from = bounds.find(value => value.startsWith('gte.'))?.slice(4)
    const through = bounds.find(value => value.startsWith('lte.'))?.slice(4)
    response = [session, priorSession, ...backfillSessions, ...voidedSessions].filter(entry => !entry.voided_at && entry.session_date >= from && entry.session_date <= through)
  } else if (name === 'shachris_student_records') {
    assert.equal(request.method(), 'GET')
    assert.equal(url.searchParams.get('student_id'), 'in.(1001,1002,1003)')
    const ids = url.searchParams.get('session_id')
    response = [...records, ...priorRecords, ...backfillRecords, ...voidedRecords].filter(record => ids.includes(record.session_id))
  } else if (name === 'shachris_events') {
    assert.equal(request.method(), 'GET')
    assert.equal(url.searchParams.get('event_type'), 'eq.historical-day-edit')
    response = historicalAudits.filter(entry => entry.session_id === url.searchParams.get('session_id')?.slice(3) && entry.student_id === Number(url.searchParams.get('student_id')?.slice(3))).toReversed()
  } else if (name === 'shachris_save_historical_day') {
    assert.equal(permission, 'edit')
    assert.ok(input.p_date < today)
    assert.ok(input.p_reason.trim())
    if (rejectHistoricalSave) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Day changed. Reload before saving.' }) })
      return
    }
    let savedSession = [priorSession, ...backfillSessions].find(entry => entry.session_date === input.p_date)
    if (!savedSession) {
      savedSession = { ...structuredClone(session), id: `backfill-${input.p_date}`, session_date: input.p_date, started_at: null, started_by_name: '', milestone_times: {} }
      backfillSessions.push(savedSession)
    }
    let record = [...priorRecords, ...backfillRecords].find(entry => entry.session_id === savedSession.id && entry.student_id === input.p_student_id)
    const before = record ? structuredClone(record) : null
    assert.equal(input.p_revision, record?.revision ?? null)
    if (!record) {
      record = { ...structuredClone(records[0]), session_id: savedSession.id, student_id: input.p_student_id, presence: 'unmarked', arrival_at: null, last_return_at: null, leave_intervals: [], requirement_result: 'pending', requirement_met_at: null, requirement_met_milestone: null, personally_cleared_at: null, personally_cleared_by_name: '', personally_cleared_milestone: null, late_minutes: null, late_reason: null, late_reason_note: '', late_excused: false, extra_stay_intervals: [], stayed_beyond_required: false, note: '', revision: 0 }
      backfillRecords.push(record)
    }
    record.historical_result = input.p_result
    record.revision++
    historicalAudits.push({ id: `audit-${historicalAudits.length}`, session_id: savedSession.id, student_id: record.student_id, actor_name: input.p_actor_name, created_at: new Date().toISOString(), detail: { reason: input.p_reason, before, after: structuredClone(record) } })
    response = { session: savedSession, record }
  } else if (name === 'shachris_settings') response = settings
  else if (name === 'dashboard_current_permissions') response = { attendance: permission, setup: permission }
  else if (name === 'shachris_open_session') {
    assert.deepEqual(input.p_student_ids, [1001, 1002, 1003])
    response = { session, records }
  }
  else if (name === 'shachris_start_correction_state') {
    assert.equal(permission, 'edit')
    assert.equal(input.p_session_id, session.id)
    response = { hasActivity: records.some(record => record.revision > 0) || Object.keys(session.milestone_times).some(id => id !== 'hodu'), audit: restartAudit }
  } else if (name === 'shachris_correct_start') {
    assert.equal(permission, 'edit')
    assert.equal(input.p_session_id, session.id)
    assert.equal(input.p_expected_start, session.started_at)
    assert.equal(input.p_mode, 'restart')
    assert.equal(input.p_confirmed, true)
    assert.ok(input.p_reason.trim())
    const oldSession = structuredClone(session)
    const oldRecords = structuredClone(records)
    const oldId = session.id
    voidedSessions.push({ ...oldSession, voided_at: new Date().toISOString() })
    voidedRecords.push(...oldRecords)
    Object.assign(session, { id: `qa-restarted-${voidedSessions.length}`, started_at: null, started_by_name: '', milestone_times: {}, config: structuredClone(settings.config), restarted_from: oldId })
    records.splice(0, records.length, ...freshRecordsTemplate.map(record => ({ ...structuredClone(record), session_id: session.id })))
    restartAudit.push({ id: `restart-${voidedSessions.length}`, action: 'restarted', previous_start: oldSession.started_at, new_start: null, actor_name: input.p_actor_name, reason: input.p_reason, created_at: new Date().toISOString() })
    response = { session, records }
  } else if (name === 'shachris_start_session') {
    session.started_at ||= `${today}T07:00:00.000Z`
    session.started_by_name = input.p_actor_name
    session.milestone_times.hodu ||= session.started_at
    response = session
  } else if (name === 'shachris_bulk_arrive_at_start') {
    response = input.p_student_ids.map(studentId => {
      const record = records.find(entry => entry.student_id === studentId)
      record.presence = 'present'
      record.arrival_at ||= session.started_at
      record.late_minutes = 0
      record.revision++
      return record
    })
  } else if (name === 'shachris_record_presence_event') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
    if (input.p_event_type === 'arrival') { record.presence = 'present'; record.arrival_at ||= at; record.late_minutes = Math.floor((Date.parse(record.arrival_at) - Date.parse(session.started_at)) / 60000); record.late_reason = 'no_reason'; record.absence_status = null }
    if (input.p_event_type === 'left') { record.presence = 'left'; record.leave_intervals.push({ leftAt: at, returnedAt: null, permission: input.p_permission }); if (record.extra_stay_intervals.at(-1)?.endedAt === null) { record.extra_stay_intervals.at(-1).endedAt = at; record.stayed_beyond_required = true } }
    if (input.p_event_type === 'returned') { record.presence = 'present'; record.last_return_at = at; record.leave_intervals.at(-1).returnedAt = at; if (record.personally_cleared_at) record.extra_stay_intervals.push({ startedAt: at, endedAt: null }) }
    record.revision++
    response = record
  } else if (name === 'shachris_end_live_session') {
    assert.equal(permission, 'edit')
    assert.equal(input.p_session_id, session.id)
    assert.ok(session.started_at)
    session.milestone_times['live-session-ended'] ||= await page.evaluate(() => new Date().toISOString())
    response = session
  } else if (name === 'shachris_mark_milestone') {
    const at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
    session.milestone_times[input.p_milestone_id] = at
    response = { session, records, metCount: 0, notMetCount: 0, alreadyMarked: false }
  } else if (name === 'shachris_update_daily_fact') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    assert.equal(input.p_record_revision, record.revision)
    if (input.p_action === 'late-reason') {
      record.late_reason = input.p_detail.reason
      record.late_reason_note = input.p_detail.note
      record.late_excused = input.p_detail.reason === 'excused' || input.p_detail.excused
    } else if (input.p_action === 'nonattendance') {
      record.presence = input.p_detail.status === 'unmarked' ? 'unmarked' : 'absent'
      record.absence_status = input.p_detail.status === 'unmarked' ? null : input.p_detail.status
    } else if (input.p_action === 'personal-clearance') {
      assert.equal(record.presence, 'present')
      assert.ok(session.milestone_times[record.stay_requirement.requiredUntil])
      record.personally_cleared_at = `${today}T07:${String(eventMinute++).padStart(2, '0')}:00.000Z`
      record.personally_cleared_by_name = input.p_actor_name
      record.personally_cleared_milestone = record.stay_requirement.requiredUntil
      record.requirement_result = 'met'
      record.extra_stay_intervals.push({ startedAt: record.personally_cleared_at, endedAt: null })
    }
    record.revision++
    response = record
  } else if (name === 'shachris_set_stay_requirement') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const milestone = config.stayMilestones.find(entry => entry.id === input.p_required_until)
    record.stay_requirement = { age: record.stay_requirement.age, requiredUntil: input.p_required_until, label: milestone.label, source: input.p_mode, duration: input.p_duration }
    record.requirement_result = 'pending'
    record.requirement_met_at = null
    record.requirement_met_milestone = null
    record.revision++
    const assignment = { id: `stay-${stayHistory.length}`, student_id: input.p_student_id, mode: input.p_mode, required_until: input.p_required_until, reason: input.p_reason, actor_name: input.p_actor_name, effective_date: today, duration: input.p_duration, created_at: now.toISOString() }
    stayHistory.unshift(assignment)
    response = { assignment, record }
  } else if (name === 'shachris_stay_expectations') response = stayHistory.filter(entry => entry.student_id === Number(url.searchParams.get('student_id')?.replace('eq.', '')))
  else if (name === 'shachris_expectations') response = progressionHistory.filter(entry => entry.student_id === Number(url.searchParams.get('student_id')?.replace('eq.', '')))
  else if (name === 'shachris_save_records') {
    response = input.p_records.map(incoming => {
      const record = records.find(entry => entry.student_id === incoming.student_id)
      assert.equal(record.revision, incoming.revision)
      Object.assign(record, incoming, { revision: record.revision + 1, updated_by_name: input.p_actor_name })
      return record
    })
  } else if (name === 'shachris_set_expectation') {
    const record = records.find(entry => entry.student_id === input.p_student_id)
    const milestone = config.milestones.find(entry => entry.id === (input.p_mode === 'manual' ? input.p_milestone_id : config.fallbackMilestoneId))
    record.expectation = { milestoneId: milestone.id, label: milestone.label, sectionIds: input.p_mode === 'manual' ? input.p_section_ids : milestone.sectionIds, source: input.p_mode, duration: input.p_duration }
    record.revision++
    const assignment = { id: `progress-${progressionHistory.length}`, student_id: input.p_student_id, mode: input.p_mode, milestone_id: milestone.id, section_ids: input.p_mode === 'manual' ? input.p_section_ids : null, reason: input.p_reason, actor_name: input.p_actor_name, effective_date: today, duration: input.p_duration, created_at: now.toISOString() }
    progressionHistory.unshift(assignment)
    response = { assignment, record }
  } else if (name === 'shachris_save_settings') {
    assert.equal(settings.revision, input.p_revision)
    settings.config = input.p_config
    settings.revision++
    response = settings
  } else if (name === 'students') {
    savedDob = input.date_of_birth
    response = { id: 1001, date_of_birth: savedDob }
  } else throw new Error(`Unexpected API: ${name}`)
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) })
})

async function waitSaved() {
  await page.getByRole('status').filter({ hasText: /Hodu started|Live session ended|Marked .* In Shul|Arrival recorded|Departure recorded|Return recorded|Communal milestone|Stay requirement saved|Settings saved|All changes saved|Late reason saved|Personal completion|Shul status saved/ }).waitFor()
}

try {
  const base = process.env.SHACHRIS_TEST_URL || 'http://localhost:5190'
  const url = `${base}/src/components/__tests__/fixtures/shachris-preview.html`
  await page.clock.install({ time: new Date(`${today}T07:30:00.000Z`) })
  await page.goto(url)
  await page.getByRole('button', { name: 'Start Session' }).waitFor()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.equal(await page.locator('.sh-communal-milestone').last().locator('strong').innerText(), 'Finish Davening')
  assert.equal(await page.locator('.sh-live-card').count(), 3, await page.locator('body').innerText())
  assert.equal(await page.locator('.sh-live-grid').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 4)
  const compactHeight = await page.locator('.sh-live-card').first().evaluate(node => node.getBoundingClientRect().height)
  const topBefore = await page.locator('.sh-communal-milestones').evaluate(node => node.getBoundingClientRect().height)
  const originalCardStyle = await page.addStyleTag({ content: `
    .sh-live-grid > .sh-live-card { padding:13px }
    .sh-live-card .sh-card-attendance:has(.sh-nonattendance) { display:block }
    .sh-live-card .sh-live-card-head { gap:9px; margin-bottom:12px }
    .sh-live-card .sh-student-avatar { width:38px; height:38px }
    .sh-live-card .sh-presence-badge { padding:5px 8px }
    .sh-live-card .sh-stay-requirement { padding:9px 10px; gap:2px 6px }
    .sh-live-card .sh-stay-requirement > span { grid-column:1/-1; font-size:9px }
    .sh-live-card .sh-stay-requirement .sh-adjust { grid-row:2; min-height:0 }
    .sh-live-card .sh-arrival-row, .sh-live-card .sh-current-leave, .sh-live-card .sh-return-row { min-height:34px; gap:6px }
    .sh-live-card .sh-requirement-result { min-height:48px; gap:8px; margin:9px 0; padding:8px 9px }
    .sh-live-card .sh-requirement-result > div { gap:2px }
    .sh-live-card .sh-requirement-result span { font-size:10px; line-height:1.3 }
    .sh-live-card .sh-live-actions .sh-button { min-height:37px; padding:7px 6px }
    .sh-live-card .sh-clearance-button { min-height:37px; padding:8px 11px; margin-bottom:9px }
    .sh-live-card .sh-progress-card { margin-top:11px; padding-top:8px }
    .sh-live-card .sh-progress-card > summary { min-height:0 }
    .sh-live-card .sh-nonattendance { padding:8px 0 }
  ` })
  const originalHeight = await page.locator('.sh-live-card').first().evaluate(node => node.getBoundingClientRect().height)
  const reduction = 1 - compactHeight / originalHeight
  console.log(`Card heights: original ${originalHeight}px, compact ${compactHeight}px, reduction ${(reduction * 100).toFixed(1)}%`)
  assert.ok(reduction >= 0.28, `Card reduction ${(reduction * 100).toFixed(1)}%`)
  assert.ok(compactHeight < 237, `Cards should be denser than previous 237px: ${compactHeight}px`)
  assert.equal(await page.locator('.sh-communal-milestones').evaluate(node => node.getBoundingClientRect().height), topBefore)
  await originalCardStyle.evaluate(node => node.remove())
  assert.ok(await page.locator('.sh-live-actions .sh-button').first().evaluate(node => node.getBoundingClientRect().height >= 44))
  assert.equal(await page.locator('.sh-progress-card').first().evaluate(node => node.open), false)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-compact-cards-1440.png`, fullPage: true })
  for (const [width, columns] of [[1440, 4], [1180, 4], [1024, 4], [960, 3], [820, 2], [640, 2], [390, 1], [320, 1]]) {
    await page.setViewportSize({ width, height: 900 })
    assert.equal(await page.locator('.sh-live-grid').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), columns, `Grid columns at ${width}px`)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    assert.ok(await page.getByRole('button', { name: 'Finish Davening', exact: true }).evaluate(button => {
      const control = button.getBoundingClientRect()
      const tile = button.parentElement.getBoundingClientRect()
      return control.left >= tile.left && control.right <= tile.right
    }), `Finish control stays inside its milestone at ${width}px`)
    assert.ok(await page.locator('.sh-live-actions .sh-button').first().evaluate(node => node.getBoundingClientRect().height >= 44))
    assert.equal(await page.locator('.sh-progress-card').first().evaluate(node => node.open), false)
    assert.ok(await page.locator('.sh-live-card').first().evaluate(node => Array.from(node.querySelectorAll('button, .sh-card-name, .sh-presence-badge')).every(element => element.scrollWidth <= element.clientWidth + 1)), `Card content fits at ${width}px`)
    await page.screenshot({ path: `${screenshotDirectory}/shachris-compact-cards-${width}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Alef' }).textContent(), /Age 11.*Shemoneh Esrei/)
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Beis' }).textContent(), /Age 12.*Chazaras HaShatz/)
  assert.match(await page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' }).textContent(), /Age 13.*End Davening/)

  const expectedBeforeFilter = JSON.stringify(records.map(record => record.stay_requirement))
  assert.deepEqual(await page.getByLabel('Class or group').locator('option').allTextContents(), ['Entire roster', '7th Grade', '8th Grade'])
  await page.getByLabel('Class or group').selectOption('class:yk-a')
  assert.equal(await page.locator('.sh-live-card').count(), 1)
  assert.equal(JSON.stringify(records.map(record => record.stay_requirement)), expectedBeforeFilter)
  await page.getByLabel('Class or group').selectOption('all')

  await page.getByRole('button', { name: 'Start Session' }).click()
  await waitSaved()
  assert.equal(session.milestone_times.hodu, session.started_at)
  await page.getByLabel('Class or group').selectOption('class:yk-b')
  await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu' }).click()
  await waitSaved()
  assert.equal(records[0].arrival_at, session.started_at)
  assert.equal(records[1].arrival_at, session.started_at)
  await page.getByLabel('Class or group').selectOption('all')

  for (const width of [1024, 960, 820, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const permissionStyles = await page.locator('.sh-live-card').first().evaluate(node => {
      const permitted = node.querySelector('.sh-leave-permitted')
      const unpermitted = node.querySelector('.sh-leave-unpermitted')
      return [permitted, unpermitted].map(button => ({ background: getComputedStyle(button).backgroundColor, color: getComputedStyle(button).color, height: button.getBoundingClientRect().height, fits: button.scrollWidth <= button.clientWidth + 1 }))
    })
    assert.equal(permissionStyles[0].background, 'rgb(248, 249, 248)')
    assert.equal(permissionStyles[1].background, permissionStyles[0].background)
    assert.equal(permissionStyles[1].color, permissionStyles[0].color)
    assert.ok(permissionStyles.every(style => style.height >= 44 && style.fits))
    await page.screenshot({ path: `${screenshotDirectory}/shachris-leave-buttons-${width}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })

  const age13Card = page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' })
  await age13Card.getByRole('button', { name: 'In Shul / Arrived' }).click()
  await waitSaved()
  assert.ok(Date.parse(records[2].arrival_at) > Date.parse(session.started_at))
  assert.match(await age13Card.textContent(), /min late/)
  await page.getByLabel('Late arrival reason option').selectOption('excused')
  await page.getByRole('button', { name: 'Save Reason' }).click()
  await waitSaved()
  assert.equal(records[2].late_excused, true)
  assert.match(await age13Card.locator('.sh-late-pill.excused').textContent(), /min late/)

  const age11Card = page.locator('.sh-live-card').filter({ hasText: 'Student Alef' })
  await age11Card.getByRole('button', { name: 'Left With Permission' }).click()
  await waitSaved()
  assert.equal(await age11Card.locator('.sh-current-leave').evaluate(node => getComputedStyle(node).color), 'rgb(121, 100, 59)')
  await age11Card.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  assert.equal(await age11Card.locator('.sh-return-row > span').last().evaluate(node => getComputedStyle(node).color), 'rgb(121, 100, 59)')
  await age11Card.getByRole('button', { name: 'Left Without Permission' }).click()
  await waitSaved()
  assert.equal(await age11Card.locator('.sh-current-leave').evaluate(node => getComputedStyle(node).color), 'rgb(175, 48, 60)')
  assert.equal(await age11Card.locator('.sh-current-leave > strong').evaluate(node => getComputedStyle(node).color), 'rgb(175, 48, 60)')
  await age11Card.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  assert.equal(await age11Card.locator('.sh-return-row > span').last().evaluate(node => getComputedStyle(node).color), 'rgb(175, 48, 60)')
  await page.screenshot({ path: `${screenshotDirectory}/shachris-returned-without-permission.png`, fullPage: true })
  assert.equal(records[0].leave_intervals.length, 2)
  assert.equal(records[0].leave_intervals[0].permission, 'with')
  assert.equal(records[0].leave_intervals[1].permission, 'without')

  const age12Card = page.locator('.sh-live-card').filter({ hasText: 'Student Beis' })
  await age12Card.getByRole('button', { name: 'Change requirement' }).click()
  await page.getByLabel('Required until milestone').selectOption('end-davening')
  await page.getByLabel('Stay requirement reason').fill('Temporary full davening')
  await page.getByRole('radio', { name: 'Today and future', exact: true }).check()
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(records[1].stay_requirement.source, 'manual')
  assert.equal(stayHistory[0].duration, 'future')
  await page.getByRole('button', { name: 'Close stay requirement' }).click()

  const age13Requirement = page.locator('.sh-live-card').filter({ hasText: 'Student Gimmel' })
  await age13Requirement.getByRole('button', { name: 'Change requirement' }).click()
  await page.getByLabel('Required until milestone').selectOption('shemoneh-esrei')
  await page.getByRole('radio', { name: 'Today only', exact: true }).check()
  await page.getByRole('button', { name: 'Save Override' }).click()
  await waitSaved()
  assert.equal(records[2].stay_requirement.duration, 'today')
  await page.getByRole('button', { name: 'Close stay requirement' }).click()
  await age13Requirement.getByRole('button', { name: 'Left Without Permission' }).click()
  await waitSaved()

  await page.getByRole('button', { name: 'Mark Now' }).first().click()
  await waitSaved()
  assert.equal(records[0].requirement_result, 'pending')
  assert.equal(records[2].requirement_result, 'pending')
  await age11Card.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  assert.ok(records[0].personally_cleared_at)
  await age11Card.getByRole('button', { name: 'Left With Permission' }).click()
  await waitSaved()
  assert.equal(records[0].requirement_result, 'met')
  assert.equal(records[1].requirement_result, 'pending')

  await age13Requirement.getByRole('button', { name: 'Returned' }).click()
  await waitSaved()
  await age13Requirement.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  await page.locator('.sh-communal-milestone').filter({ hasText: 'After Chazaras HaShatz' }).getByRole('button', { name: 'Mark Now' }).click()
  await waitSaved()
  assert.equal(records[1].requirement_result, 'pending')
  await page.getByRole('button', { name: 'Finish Davening', exact: true }).click()
  await waitSaved()
  assert.ok(session.milestone_times['end-davening'])
  assert.equal(session.milestone_times['live-session-ended'], undefined)
  const outAtFinish = await age11Card.locator('.sh-current-leave > strong').innerText()
  const extraAtFinish = await age13Requirement.locator('.sh-extra-stay').innerText()
  await page.clock.fastForward(120000)
  assert.notEqual(await age11Card.locator('.sh-current-leave > strong').innerText(), outAtFinish)
  assert.notEqual(await age13Requirement.locator('.sh-extra-stay').innerText(), extraAtFinish)
  assert.equal(await page.getByRole('button', { name: 'End Live Session', exact: true }).isEnabled(), true)
  assert.equal(await age13Requirement.getByRole('button', { name: 'Late reason', exact: true }).isEnabled(), true)
  assert.equal(await age11Card.getByRole('button', { name: 'Returned', exact: true }).isEnabled(), true)
  assert.equal(records[1].requirement_result, 'pending')
  await age12Card.getByRole('button', { name: 'Confirm Completion' }).click()
  await waitSaved()
  await page.getByRole('button', { name: 'End Live Session', exact: true }).click()
  await waitSaved()
  assert.ok(session.milestone_times['live-session-ended'])
  const outAtSessionEnd = await age11Card.locator('.sh-current-leave > strong').innerText()
  const extraAtSessionEnd = await age13Requirement.locator('.sh-extra-stay').innerText()
  await page.clock.fastForward(120000)
  assert.equal(await age11Card.locator('.sh-current-leave > strong').innerText(), outAtSessionEnd)
  assert.equal(await age13Requirement.locator('.sh-extra-stay').innerText(), extraAtSessionEnd)
  assert.equal(await age13Requirement.getByRole('button', { name: 'Late reason', exact: true }).isEnabled(), true)
  assert.equal(await age11Card.getByRole('button', { name: 'Returned', exact: true }).isEnabled(), true)
  assert.equal(records[1].requirement_result, 'met')
  assert.equal(records[2].requirement_result, 'met')
  assert.equal(records[0].stayed_beyond_required, true)
  assert.equal(await age11Card.locator('.sh-current-leave').evaluate(node => getComputedStyle(node).color), 'rgb(121, 100, 59)')
  assert.equal(await age11Card.locator('.sh-current-leave > strong').evaluate(node => getComputedStyle(node).color), 'rgb(175, 48, 60)')
  assert.equal(await age11Card.locator('.sh-return-row').evaluate(node => getComputedStyle(node).color), 'rgb(175, 48, 60)')

  assert.equal(await age11Card.locator('details.sh-progress-card').evaluate(node => node.open), false)
  await age11Card.locator('details.sh-progress-card > summary').click()
  assert.equal(await page.getByLabel('Student Alef: Shema').count(), 1)
  assert.match(await age11Card.locator('details.sh-progress-card').textContent(), /Next: Ashrei/)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-live-session-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-live-session-mobile.png`, fullPage: true })

  await page.getByRole('button', { name: 'Rules & Settings' }).click()
  assert.equal(await page.getByLabel('Age 11 required until').inputValue(), 'shemoneh-esrei')
  assert.equal(await page.getByLabel('Age 12 required until').inputValue(), 'chazaras-hashatz')
  assert.equal(await page.getByLabel('Age 13 required until').inputValue(), 'end-davening')
  assert.equal(await page.getByLabel('Arrival grace minutes').inputValue(), '2')
  assert.equal(await page.getByLabel('Require On Time every required day', { exact: true }).isChecked(), true)
  await page.getByLabel('Excused lateness may count as On Time', { exact: true }).check()
  await page.getByLabel('Allowed exceptions per week').fill('1')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await page.getByRole('status').filter({ hasText: 'Shachris settings saved.' }).waitFor()
  assert.deepEqual(settings.config.weeklyEligibility, { requireOnTime: true, requireEntireStay: true, excusedLateCountsOnTime: true, ignoreExcusedAbsence: false, allowedExceptions: 1 })
  const savedBeforeHistory = JSON.stringify({ records, priorRecords, session, priorSession })
  const requestsBeforeHistory = requests.length
  await page.getByRole('button', { name: 'Weekly Record / History' }).click()
  await page.locator('.sh-week-table').waitFor()
  assert.equal(await page.locator('.sh-week-table tbody tr').count(), 3)
  assert.equal(await page.locator('.sh-week-table').evaluate(node => getComputedStyle(node).borderCollapse), 'separate')
  assert.equal(await page.locator('.sh-week-upcoming').first().evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)')
  await page.getByRole('button', { name: 'Last Week', exact: true }).click()
  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).waitFor()
  for (const [student, tone, background] of [['Student Alef', 'mixed', 'rgb(255, 248, 235)'], ['Student Beis', 'excused', 'rgb(255, 248, 235)'], ['Student Gimmel', 'good', 'rgb(240, 248, 242)']]) {
    const cell = page.getByRole('button', { name: `${student}: ${priorDay}`, exact: true })
    assert.ok((await cell.getAttribute('class')).includes(`sh-week-${tone}`))
    assert.equal(await cell.evaluate(node => getComputedStyle(node).backgroundColor), background)
    assert.match(await cell.innerText(), /On Time|Late/)
    assert.match(await cell.innerText(), /Stayed Entire Time/)
    assert.ok(await cell.evaluate(node => node.getBoundingClientRect().height >= 44 && node.scrollWidth <= node.clientWidth + 1))
  }
  assert.equal(await page.locator('.sh-week-incomplete').first().evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(243, 244, 244)')
  assert.equal(await page.locator('.sh-week-table tbody tr').filter({ hasText: 'Student Alef' }).locator('td').last().locator('strong').innerText(), 'Yes')
  assert.equal(await page.locator('.sh-week-table tbody tr').filter({ hasText: 'Student Beis' }).locator('td').last().locator('strong').innerText(), 'Yes')
  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).click()
  const dayDialog = page.getByRole('dialog', { name: 'Saved Shachris day' })
  assert.match(await dayDialog.innerText(), /Saved history note/)
  assert.match(await dayDialog.innerText(), /2 min/)
  assert.match(await dayDialog.innerText(), /With permission/)
  assert.equal(await dayDialog.locator('input, select').count(), 0)
  await page.getByRole('button', { name: 'Close day details' }).click()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    await page.screenshot({ path: `${screenshotDirectory}/shachris-weekly-${width}.png`, fullPage: true })
  }
  await page.getByRole('button', { name: 'Previous week', exact: true }).click()
  await page.getByText('No required days recorded', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.sh-week-table tbody tr').first().locator('td').last().locator('strong').innerText(), 'No')
  await page.getByRole('button', { name: 'Next week', exact: true }).click()
  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).waitFor()
  assert.ok(requests.slice(requestsBeforeHistory).every(request => request.method === 'GET'))
  assert.equal(JSON.stringify({ records, priorRecords, session, priorSession }), savedBeforeHistory)

  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).click()
  const beforeCancel = requests.length
  await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).click()
  await page.getByLabel('Historical day note').fill('Canceled change')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.ok(requests.slice(beforeCancel).every(request => request.method === 'GET'))
  assert.equal(JSON.stringify({ records, priorRecords, session, priorSession }), savedBeforeHistory)
  await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).click()
  await page.getByLabel('Historical arrival result').selectOption('false')
  await page.getByLabel('Historical late reason', { exact: true }).selectOption('other')
  await page.getByLabel('Historical late reason note').fill('Paper log correction')
  await page.getByLabel('Historical late excused').check()
  await page.getByLabel('Historical required stay').selectOption('false')
  await page.getByLabel('Historical day note').fill('Corrected saved results')
  await page.getByLabel('Historical edit reason').fill('Reviewed last week paper log')
  await page.screenshot({ path: `${screenshotDirectory}/shachris-historical-edit-form-320.png`, fullPage: true })
  await page.getByRole('button', { name: 'Save Day', exact: true }).click()
  await dayDialog.getByText('Reviewed last week paper log', { exact: true }).waitFor()
  assert.equal(historicalAudits.length, 1)
  assert.equal(priorRecords[0].arrival_at, historicalAudits[0].detail.before.arrival_at)
  assert.deepEqual(priorRecords[0].leave_intervals, historicalAudits[0].detail.before.leave_intervals)
  assert.equal(priorRecords[0].note, 'Saved history note')
  assert.equal(priorRecords[0].historical_result.note, 'Corrected saved results')
  assert.equal(await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(252, 240, 241)')
  assert.match(await dayDialog.innerText(), /Before: Recorded facts/)
  assert.match(await dayDialog.innerText(), /After: present \/ Late \/ Did Not Stay Required Time/)
  assert.equal(await dayDialog.locator('dt').filter({ hasText: 'Minutes late' }).evaluate(node => node.nextElementSibling.textContent), '0')
  rejectHistoricalSave = true
  await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).click()
  await page.getByLabel('Historical edit reason').fill('Stale test')
  await page.getByRole('button', { name: 'Save Day', exact: true }).click()
  await dayDialog.getByRole('alert').filter({ hasText: 'Day changed.' }).waitFor()
  assert.equal(historicalAudits.length, 1)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  rejectHistoricalSave = false
  await page.getByRole('button', { name: 'Close day details' }).click()
  await page.getByRole('button', { name: 'Previous week', exact: true }).click()
  await page.getByText('No required days recorded', { exact: true }).first().waitFor()
  const backfillButton = page.locator('.sh-week-table tbody tr').first().locator('.sh-week-day').first()
  const backfillDate = (await backfillButton.getAttribute('aria-label')).split(': ')[1]
  await backfillButton.click()
  assert.equal(await dayDialog.locator('input, select').count(), 0)
  await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).click()
  await page.getByLabel('Historical arrival result').selectOption('true')
  await page.getByLabel('Historical required stay').selectOption('true')
  await page.getByLabel('Historical day note').fill('No tablet yet')
  await page.getByLabel('Historical edit reason').fill('Backfilled from paper')
  await page.getByRole('button', { name: 'Save Day', exact: true }).click()
  await dayDialog.getByText('Backfilled from paper', { exact: true }).waitFor()
  assert.equal(backfillRecords.length, 1)
  assert.equal(backfillSessions[0].started_at, null)
  assert.equal(backfillRecords[0].arrival_at, null)
  await page.getByRole('button', { name: 'Close day details' }).click()
  assert.equal(await page.locator('.sh-week-table tbody tr').first().locator('td').last().locator('strong').innerText(), 'Yes')
  await page.getByRole('button', { name: `Student Alef: ${backfillDate}`, exact: true }).click()
  await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).click()
  await page.getByLabel('Historical attendance status').selectOption('excused')
  await page.getByLabel('Historical edit reason').fill('Absence was excused')
  await page.getByRole('button', { name: 'Save Day', exact: true }).click()
  await dayDialog.getByText('Absence was excused', { exact: true }).waitFor()
  assert.equal(backfillRecords[0].historical_result.onTime, null)
  assert.equal(backfillRecords[0].historical_result.stayedRequired, null)
  assert.equal(historicalAudits.length, 3)
  assert.match(await dayDialog.innerText(), /Original Recorded Facts/)
  await page.screenshot({ path: `${screenshotDirectory}/shachris-historical-edit-audit-320.png`, fullPage: true })
  await page.getByRole('button', { name: 'Close day details' }).click()
  await page.getByRole('button', { name: 'Last Week', exact: true }).click()
  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).waitFor()
  await page.getByRole('navigation', { name: 'Shachris views' }).getByRole('button', { name: 'Live Session', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  const beforeOldDate = requests.length
  await page.getByLabel('Session date').fill(priorDay)
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu' }).isDisabled(), true)
  assert.ok(!requests.slice(beforeOldDate).some(request => request.name === 'shachris_open_session'))
  permission = 'view'
  await page.reload()
  await page.getByRole('status').filter({ hasText: 'View only' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Correct Hodu Start', exact: true }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Start Session' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Mark Visible In Shul at Hodu' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Weekly Record / History' }).click()
  await page.getByRole('button', { name: 'Last Week', exact: true }).click()
  await page.getByRole('button', { name: `Student Alef: ${priorDay}`, exact: true }).click()
  assert.equal(await dayDialog.getByRole('button', { name: 'Edit Day', exact: true }).count(), 0)
  assert.equal(await dayDialog.locator('input, select').count(), 0)

  await page.getByRole('button', { name: 'Close day details' }).click()
  permission = 'edit'
  await page.reload()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  const beforeRestart = structuredClone({ session, records })
  await page.getByRole('button', { name: 'Correct Hodu Start', exact: true }).click()
  await page.getByLabel('Hodu correction mode').selectOption('restart')
  const restartButton = page.getByRole('button', { name: "Restart Today's Session", exact: true })
  assert.equal(await restartButton.isDisabled(), true)
  await page.getByLabel('Hodu correction reason').fill('Testing cleanup: fresh today')
  assert.equal(await restartButton.isDisabled(), true)
  await page.getByLabel('Confirm Hodu correction').check()
  await page.screenshot({ path: `${screenshotDirectory}/shachris-restart-confirmation.png`, fullPage: true })
  await restartButton.click()
  await page.getByRole('status').filter({ hasText: "Today's session restarted." }).waitFor()
  assert.notEqual(session.id, beforeRestart.session.id)
  assert.equal(session.started_at, null)
  assert.deepEqual(session.milestone_times, {})
  assert.deepEqual(voidedRecords, beforeRestart.records)
  assert.equal(voidedSessions.length, 1)
  assert.equal(restartAudit.length, 1)
  assert.ok(records.every(record => record.presence === 'unmarked' && record.arrival_at === null && record.late_reason === null && record.leave_intervals.length === 0 && record.absence_status === null && record.personally_cleared_at === null && record.requirement_result === 'pending' && record.note === ''))
  assert.equal(await page.getByRole('button', { name: 'Start Session', exact: true }).count(), 1)
  await page.getByRole('button', { name: 'Weekly Record / History' }).click()
  await page.locator('.sh-week-table').waitFor()
  assert.equal(await page.locator('.sh-week-table tbody tr').first().locator('td').last().locator('strong').innerText(), 'No')
  assert.match(await page.locator('.sh-week-table tbody tr').first().innerText(), /Not started/)
  await page.getByRole('navigation', { name: 'Shachris views' }).getByRole('button', { name: 'Live Session', exact: true }).click()
  await page.getByRole('button', { name: 'Session Corrections', exact: true }).click()
  await page.getByText('Testing cleanup: fresh today', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Hodu correction mode').inputValue(), 'restart')
  await page.getByRole('button', { name: 'Close start correction' }).click()
  const restartedId = session.id
  await page.reload()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.equal(session.id, restartedId)
  assert.equal(await page.getByRole('button', { name: 'Start Session', exact: true }).count(), 1)

  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await waitSaved()
  for (const label of ['After Shemoneh Esrei', 'After Chazaras HaShatz']) {
    await page.locator('.sh-communal-milestone').filter({ hasText: label }).getByRole('button', { name: 'Mark Now' }).click()
    await waitSaved()
  }
  await page.getByLabel('Class or group').selectOption('class:yk-a')
  const unexpectedDialog = async dialog => { await dialog.dismiss(); throw new Error('Communal Finish Davening must not warn about Not Marked students') }
  page.on('dialog', unexpectedDialog)
  await page.getByRole('button', { name: 'Finish Davening', exact: true }).click()
  await waitSaved()
  page.off('dialog', unexpectedDialog)
  assert.ok(session.milestone_times['end-davening'])
  assert.equal(session.milestone_times['live-session-ended'], undefined)
  const writesBeforeCancel = requests.length
  page.once('dialog', async dialog => {
    assert.match(dialog.message(), /3 students are still Not Marked/)
    await dialog.dismiss()
  })
  await page.getByRole('button', { name: 'End Live Session', exact: true }).click()
  assert.equal(session.milestone_times['live-session-ended'], undefined)
  assert.equal(requests.length, writesBeforeCancel)
  page.once('dialog', async dialog => {
    assert.match(dialog.message(), /3 students are still Not Marked/)
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'End Live Session', exact: true }).click()
  await waitSaved()
  const savedEnd = session.milestone_times['live-session-ended']
  assert.ok(savedEnd)
  await page.getByLabel('Student Gimmel: Shul status').selectOption('excused')
  await waitSaved()
  assert.equal(records[2].absence_status, 'excused')
  await page.getByRole('button', { name: 'Reload saved session', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Ready' }).waitFor()
  assert.equal(session.milestone_times['live-session-ended'], savedEnd)
  assert.match(await page.locator('.sh-live-toolbar').innerText(), /Live session ended/)
  assert.equal(await page.getByRole('button', { name: 'Correct Hodu Start', exact: true }).isEnabled(), true)

  await page.goto(`${url}?dob=1`)
  await page.getByLabel('Regular date of birth').fill('2013-10-06')
  await page.getByRole('button', { name: 'Save DOB' }).click()
  await page.getByRole('status').filter({ hasText: 'Date of birth saved.' }).waitFor()
  assert.equal(savedDob, '2013-10-06')
  assert.deepEqual(errors, [])
  console.log('PASS: secure today restart with reason/confirmation, fresh state, preserved voided records, audit/reopen/history exclusion; compact cards, leave colors, weekly cells, historical editing and view-only regression. Synthetic data only; no school writes.')
} finally {
  await browser.close()
}
